/**
 * Blog authoring CLI. Run via `npm run blog -- <command>`.
 *
 *   draft <slug>          scaffold a new draft markdown file locally
 *   pull <slug>           fetch a post from DynamoDB into content-drafts/
 *   push <file|slug>      validate and upsert a local file to DynamoDB
 *   publish <slug>        validate hard, mark published, trigger a deploy
 *   unpublish <slug>      revert to draft, trigger a deploy
 *   list [--drafts]       show posts in the table
 *   lint <file|slug>      validate without writing anything
 *   preview <slug>        pull (if needed) and print the dev-server URL
 *
 * Access control is IAM: writes require James's AWS credentials. There is no
 * public write path and no admin UI (docs/BLOG_PLAN.md §4).
 *
 * Logs deliberately contain slugs and titles only — never author or reader
 * personal data.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  postSchema,
  lintBody,
  slugPattern,
  toItem,
  wordCount,
  type Post,
} from '../../src/lib/blog-schema';

const TABLE = process.env.BLOG_TABLE ?? 'jamesevans.au-blog';
const REGION = process.env.AWS_REGION ?? 'ap-southeast-2';
const DRAFTS_DIR = resolve(process.cwd(), 'content-drafts');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// ---- helpers ------------------------------------------------------------

function fail(message: string): never {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

function ok(message: string): void {
  console.log(`  ✓ ${message}`);
}

function draftPath(slug: string): string {
  return resolve(DRAFTS_DIR, `${slug}.md`);
}

/** Resolve a "file.md" or bare slug argument to a local draft path. */
function resolveLocal(arg: string): string {
  if (arg.endsWith('.md')) {
    const path = resolve(process.cwd(), arg);
    if (!existsSync(path)) fail(`no such file: ${arg}`);
    return path;
  }
  const path = draftPath(arg);
  if (!existsSync(path)) {
    fail(`no local draft for "${arg}" — run: npm run blog -- pull ${arg}`);
  }
  return path;
}

function readLocal(path: string): Post {
  const { data, content } = matter(readFileSync(path, 'utf8'));
  const parsed = postSchema.safeParse({ ...data, bodyMarkdown: content.trim() });
  if (!parsed.success) {
    console.error(`\n  ✗ ${path} is not a valid post:\n`);
    for (const issue of parsed.error.issues) {
      console.error(`      ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    console.error('');
    process.exit(1);
  }
  return parsed.data;
}

function writeLocal(post: Post): string {
  mkdirSync(DRAFTS_DIR, { recursive: true });
  const { bodyMarkdown, ...frontmatter } = post;
  const path = draftPath(post.slug);
  writeFileSync(path, matter.stringify(`\n${bodyMarkdown}\n`, frontmatter), 'utf8');
  return path;
}

async function getRemote(slug: string): Promise<Post | undefined> {
  const result = await client.send(
    new GetCommand({ TableName: TABLE, Key: { pk: 'POST', sk: slug } }),
  );
  if (!result.Item) return undefined;
  const parsed = postSchema.safeParse(result.Item);
  if (!parsed.success) {
    fail(
      `stored post "${slug}" fails validation: ${parsed.error.issues
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}

async function putRemote(post: Post): Promise<void> {
  await client.send(new PutCommand({ TableName: TABLE, Item: toItem(post) }));
}

/** Report validation problems. Returns the problem list. */
function report(post: Post): string[] {
  const problems = lintBody(post);
  console.log(`\n  ${post.title}`);
  console.log(`  /blog/${post.slug}/ · ${post.status} · ${wordCount(post.bodyMarkdown)} words`);
  console.log(`  tags: ${post.tags.join(', ')}`);
  console.log(`  description: ${post.description.length} chars`);
  if (problems.length === 0) {
    console.log('\n  ✓ no problems found\n');
  } else {
    console.log('');
    for (const problem of problems) console.log(`  ! ${problem}`);
    console.log('');
  }
  return problems;
}

/** Fire the GitHub Actions deploy. Requires the gh CLI to be authenticated. */
function triggerDeploy(reason: string): void {
  try {
    const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], {
      encoding: 'utf8',
    }).trim();
    execFileSync(
      'gh',
      ['api', `repos/${repo}/dispatches`, '-f', 'event_type=blog-publish'],
      { stdio: 'pipe' },
    );
    ok(`deploy triggered on ${repo} (${reason})`);
    console.log('     watch it: gh run watch');
  } catch (err) {
    const detail = err instanceof Error ? err.message.split('\n')[0] : String(err);
    console.warn(`  ! could not trigger the deploy automatically: ${detail}`);
    console.warn('     the content is saved; deploy manually with: gh workflow run deploy.yml');
  }
}

// ---- commands -----------------------------------------------------------

async function cmdDraft(slug?: string): Promise<void> {
  if (!slug) fail('usage: npm run blog -- draft <slug>');
  if (!slugPattern.test(slug)) fail(`"${slug}" is not lowercase kebab-case`);

  const path = draftPath(slug);
  if (existsSync(path)) fail(`content-drafts/${slug}.md already exists`);
  if (await getRemote(slug)) {
    fail(`a post with slug "${slug}" already exists in the table`);
  }

  mkdirSync(DRAFTS_DIR, { recursive: true });
  const title = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const scaffold = `---
slug: ${slug}
title: ${title}
description: >-
  REPLACE ME — 140 to 160 characters, written for a search result. Say what the
  reader will be able to do after reading, in plain language.
status: draft
tags:
  - guides
---

Opening paragraph: name the problem the reader has, in their words. No preamble
about what the article will cover.

## First section

Body text. Start sections at H2 — the page renders the title as the only H1.

## Where to start

Close with the single next action worth taking, and a link to
[what I do](/services/) where it genuinely fits.
`;

  writeFileSync(path, scaffold, 'utf8');
  ok(`created content-drafts/${slug}.md`);
  console.log(`\n  Edit it, then:  npm run blog -- push ${slug}\n`);
}

async function cmdPull(slug?: string): Promise<void> {
  if (!slug) fail('usage: npm run blog -- pull <slug>');
  const post = await getRemote(slug);
  if (!post) fail(`no post "${slug}" in ${TABLE}`);
  const path = writeLocal(post);
  ok(`wrote ${path.replace(`${process.cwd()}/`, '')} (${post.status})`);
}

async function cmdPush(arg?: string): Promise<void> {
  if (!arg) fail('usage: npm run blog -- push <file.md|slug>');
  const post = readLocal(resolveLocal(arg));
  const problems = report(post);

  // Warnings don't block a draft push — an in-progress post is often short.
  if (post.status === 'published' && problems.length > 0) {
    fail('published posts must have no problems; fix the above or push as a draft');
  }

  const existing = await getRemote(post.slug);
  if (existing && existing.status === 'published' && post.status === 'published') {
    // Slug is the URL; changing it silently would orphan the indexed page.
    ok('updating an already-published post (URL unchanged)');
  }

  await putRemote({ ...post, updatedAt: new Date().toISOString() });
  ok(`saved "${post.slug}" to ${TABLE} as ${post.status}`);

  if (post.status === 'published') triggerDeploy(`updated ${post.slug}`);
  else console.log(`\n  Preview it:  npm run blog -- preview ${post.slug}\n`);
}

async function cmdPublish(slug?: string): Promise<void> {
  if (!slug) fail('usage: npm run blog -- publish <slug>');

  // Prefer the local file when present so an unpushed edit can't be missed.
  const localPath = draftPath(slug);
  const post = existsSync(localPath) ? readLocal(localPath) : await getRemote(slug);
  if (!post) fail(`no post "${slug}" locally or in ${TABLE}`);

  const problems = report(post);
  if (problems.length > 0) fail('fix the problems above before publishing');
  if (wordCount(post.bodyMarkdown) < 600) {
    fail(`only ${wordCount(post.bodyMarkdown)} words — too thin to publish`);
  }

  const now = new Date().toISOString();
  const existing = await getRemote(slug);
  const published: Post = {
    ...post,
    status: 'published',
    // First publish sets the date; re-publishing keeps the original.
    publishedAt: existing?.publishedAt ?? post.publishedAt ?? now,
    updatedAt: now,
  };

  await putRemote(published);
  ok(`published "${slug}"`);
  console.log(`     https://jamesevans.au/blog/${slug}/ (live after the deploy)`);
  triggerDeploy(`published ${slug}`);
}

async function cmdUnpublish(slug?: string): Promise<void> {
  if (!slug) fail('usage: npm run blog -- unpublish <slug>');
  const post = await getRemote(slug);
  if (!post) fail(`no post "${slug}" in ${TABLE}`);
  if (post.status === 'draft') fail(`"${slug}" is already a draft`);

  await putRemote({ ...post, status: 'draft', updatedAt: new Date().toISOString() });
  ok(`"${slug}" reverted to draft`);
  console.log('     the page 404s once the deploy completes');
  triggerDeploy(`unpublished ${slug}`);
}

async function cmdList(args: string[]): Promise<void> {
  const only = args.includes('--drafts')
    ? 'draft'
    : args.includes('--published')
      ? 'published'
      : undefined;

  const statuses = only ? [only] : ['published', 'draft'];
  const rows: Post[] = [];
  for (const status of statuses) {
    const result = await client.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'by-status',
        KeyConditionExpression: 'gsi1pk = :s',
        ExpressionAttributeValues: { ':s': status },
        ScanIndexForward: false,
      }),
    );
    for (const item of result.Items ?? []) {
      const parsed = postSchema.safeParse(item);
      if (parsed.success) rows.push(parsed.data);
      else console.warn(`  ! skipping invalid item "${String(item.slug)}"`);
    }
  }

  if (rows.length === 0) {
    console.log(`\n  no posts in ${TABLE}\n`);
    return;
  }

  console.log('');
  for (const post of rows) {
    const date = post.publishedAt?.slice(0, 10) ?? post.updatedAt?.slice(0, 10) ?? '—';
    const badge = post.status === 'published' ? 'live ' : 'draft';
    const localFlag = existsSync(draftPath(post.slug)) ? ' (local copy)' : '';
    console.log(`  ${badge}  ${date}  ${post.slug}${localFlag}`);
    console.log(`         ${post.title}`);
  }
  console.log(`\n  ${rows.length} post(s) in ${TABLE}\n`);
}

function cmdLint(arg?: string): void {
  if (!arg) {
    // No argument: lint every local draft.
    if (!existsSync(DRAFTS_DIR)) fail('no content-drafts/ directory');
    const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith('.md'));
    if (files.length === 0) fail('no local drafts to lint');
    let bad = 0;
    for (const file of files) {
      const problems = report(readLocal(resolve(DRAFTS_DIR, file)));
      if (problems.length > 0) bad++;
    }
    if (bad > 0) process.exit(1);
    return;
  }
  const problems = report(readLocal(resolveLocal(arg)));
  if (problems.length > 0) process.exit(1);
}

async function cmdPreview(slug?: string): Promise<void> {
  if (!slug) fail('usage: npm run blog -- preview <slug>');
  if (!existsSync(draftPath(slug))) {
    const post = await getRemote(slug);
    if (!post) fail(`no post "${slug}" locally or in ${TABLE}`);
    writeLocal(post);
    ok(`pulled "${slug}" into content-drafts/`);
  }
  console.log(`
  Start the dev server (drafts are included automatically):

      npm run dev

  Then open:

      http://localhost:3000/blog/${slug}/

  To check the production render of a draft:

      BLOG_INCLUDE_DRAFTS=1 npm run build && npx serve out
`);
}

// ---- entry --------------------------------------------------------------

const [command, ...rest] = process.argv.slice(2);

const commands: Record<string, () => void | Promise<void>> = {
  draft: () => cmdDraft(rest[0]),
  pull: () => cmdPull(rest[0]),
  push: () => cmdPush(rest[0]),
  publish: () => cmdPublish(rest[0]),
  unpublish: () => cmdUnpublish(rest[0]),
  list: () => cmdList(rest),
  lint: () => cmdLint(rest[0]),
  preview: () => cmdPreview(rest[0]),
};

if (!command || command === 'help' || !commands[command]) {
  console.log(`
  Blog authoring CLI

    npm run blog -- draft <slug>        scaffold a new draft
    npm run blog -- pull <slug>         fetch a post for local editing
    npm run blog -- push <file|slug>    validate and save to DynamoDB
    npm run blog -- publish <slug>      publish and deploy
    npm run blog -- unpublish <slug>    revert to draft and deploy
    npm run blog -- list [--drafts]     list posts
    npm run blog -- lint [file|slug]    validate only
    npm run blog -- preview <slug>      set up a local preview

  Table: ${TABLE} (${REGION})
`);
  process.exit(command && command !== 'help' ? 1 : 0);
}

await commands[command]();
