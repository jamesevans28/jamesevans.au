import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { site } from './site';
import { blog } from './blog';

/**
 * Guards the house prose style on reader-facing copy.
 *
 * James rejects em dashes in anything published under his name (see
 * .claude/skills/blog-post/SKILL.md). Post bodies are linted by the blog CLI,
 * but copy hardcoded in components and content modules is not, and that is
 * exactly where one survived to production: the article CTA read "actually
 * sticks — assessments, ...".
 *
 * Code comments are exempt; this only checks strings a reader can see.
 */

/**
 * Only the directories that render to a page. src/lib is excluded on purpose:
 * its strings are CLI warnings and validation messages that developers read,
 * not site visitors, and dashes there are harmless.
 */
const PROSE_DIRS = ['app', 'components', 'content'].map((d) =>
  resolve(process.cwd(), 'src', d),
);

/** Source files whose string literals reach a reader. */
function proseFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        out.push(path);
      }
    }
  };
  for (const dir of PROSE_DIRS) walk(dir);
  return out;
}

/** Strip comments so we only inspect code, then keep the string literals. */
function readerFacingText(source: string): string {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // JSX text nodes plus quoted strings and template literals.
  const strings =
    withoutComments.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g)?.join('\n') ?? '';
  const jsxText = withoutComments.replace(/<[^>]*>/g, '\n');

  return `${strings}\n${jsxText}`;
}

describe('reader-facing copy avoids AI-tell punctuation', () => {
  const files = proseFiles();

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each([
    ['em dash', '—'],
    ['en dash', '–'],
  ])('contains no %s', (_label, char) => {
    const offenders: string[] = [];

    for (const file of files) {
      const text = readerFacingText(readFileSync(file, 'utf8'));
      if (text.includes(char)) {
        const line =
          text
            .split('\n')
            .find((l) => l.includes(char))
            ?.trim()
            .slice(0, 90) ?? '';
        offenders.push(`${file.replace(`${process.cwd()}/`, '')}: ${line}`);
      }
    }

    expect(offenders, `use a comma, full stop, colon or brackets instead:\n${offenders.join('\n')}`).toEqual([]);
  });
});

describe('site and blog copy', () => {
  it('has no em dashes in the strings rendered across every page', () => {
    // site.* and blog.* appear in metadata, JSON-LD and page furniture, so a
    // stray dash here would show up sitewide.
    const serialised = JSON.stringify({ site, blog });
    expect(serialised).not.toContain('—');
    expect(serialised).not.toContain('–');
  });
});
