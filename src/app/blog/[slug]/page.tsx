import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/Container';
import { SparkField } from '@/components/SparkField';
import { ButtonLink } from '@/components/Button';
import { PostCard } from '@/components/PostCard';
import { ShareButtons } from '@/components/ShareButtons';
import { JsonLd, blogPostingSchema, breadcrumbSchema } from '@/lib/jsonld';
import { getPost, getRenderablePosts } from '@/lib/blog';
import { renderMarkdown, extractHeadings } from '@/lib/markdown';
import { formatPostDate } from '@/lib/dates';
import { tagLabels } from '@/content/blog';
import { site } from '@/content/site';

type Params = { slug: string };

/**
 * Every post gets a prerendered HTML page at build time. This is the whole
 * SEO argument for the static-export approach (docs/BLOG_PLAN.md §2):
 * crawlers receive complete content with no JavaScript execution.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getRenderablePosts();
  if (posts.length === 0) {
    // `output: export` rejects a dynamic route that produces no paths at all.
    // Before the first post is published (or on a build with no DynamoDB
    // access) emit one throwaway path; the page below calls notFound() for it,
    // so the export contains only a 404 at this URL.
    return [{ slug: '__no-posts__' }];
  }
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const url = `/blog/${post.slug}/`;
  const ogImage = `/og/blog/${post.slug}.png`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: post.canonicalUrl ?? url },
    // Drafts render locally for preview but must never be indexed.
    robots:
      post.status === 'draft'
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [site.url],
      tags: [...post.tags],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.bodyMarkdown);
  const headings = extractHeadings(post.bodyMarkdown);

  const related = (await getRenderablePosts())
    .filter((p) => p.slug !== post.slug && p.status === 'published')
    .filter((p) => p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);

  return (
    <>
      <JsonLd data={[blogPostingSchema(post), breadcrumbSchema(post)]} />

      <article>
        <header className="relative overflow-hidden border-b border-line">
          <SparkField density={24} seed={7} />
          <Container className="relative py-14 sm:py-16">
            <nav aria-label="Breadcrumb">
              <Link
                href="/blog/"
                className="text-xs font-bold uppercase tracking-[0.16em] text-volt hover:underline"
              >
                ← All writing
              </Link>
            </nav>

            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl">
              {post.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
              {post.status === 'draft' ? (
                <span className="rounded-full bg-citrus px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-on-accent">
                  Draft, not published
                </span>
              ) : null}
              {post.publishedAt ? (
                <time dateTime={post.publishedAt}>
                  {formatPostDate(post.publishedAt)}
                </time>
              ) : null}
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <ul className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium"
                  >
                    {tagLabels[tag]}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </header>

        <Container className="py-12 sm:py-16">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
            <div className="min-w-0">
              {post.heroImage ? (
                // Static export has no image optimiser; the publish CLI sizes
                // hero images ahead of time, so a plain <img> is correct here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.heroImage}
                  alt={post.heroImageAlt ?? ''}
                  width={1200}
                  height={630}
                  className="mb-10 w-full rounded-[var(--radius-card)] border border-line"
                />
              ) : null}

              <div
                className="prose-volt max-w-2xl"
                // Build-time markdown, sanitised in src/lib/markdown.ts.
                dangerouslySetInnerHTML={{ __html: html }}
              />

              <div className="mt-10 max-w-2xl border-t border-line pt-6">
                <ShareButtons slug={post.slug} title={post.title} />
              </div>

              <aside className="mt-10 max-w-2xl rounded-[var(--radius-card)] border border-line border-t-[3px] border-t-flare bg-surface p-6">
                <h2 className="font-display text-xl font-extrabold text-ink">
                  Want a hand putting this to work?
                </h2>
                <p className="mt-2 leading-relaxed text-ink-muted">
                  I help businesses and individuals adopt AI in a way that
                  actually sticks. Assessments, practical training, and setting
                  the tools up properly.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href="/services/">What I do</ButtonLink>
                  <ButtonLink href="/contact/" variant="ghost">
                    Get in touch
                  </ButtonLink>
                </div>
              </aside>
            </div>

            {headings.length > 2 ? (
              <nav
                aria-label="On this page"
                className="mt-12 lg:sticky lg:top-24 lg:mt-0 lg:self-start"
              >
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
                  On this page
                </h2>
                <ul className="mt-3 flex flex-col gap-2 border-l border-line pl-4 text-sm">
                  {headings.map((heading) => (
                    <li
                      key={heading.id}
                      className={heading.depth === 3 ? 'pl-3' : undefined}
                    >
                      <a
                        href={`#${heading.id}`}
                        className="text-ink-muted hover:text-volt"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        </Container>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-line">
          <Container className="py-14 sm:py-16">
            <h2 className="font-display text-2xl font-extrabold text-ink">
              More like this
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
