import type { Metadata } from 'next';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SparkField } from '@/components/SparkField';
import { PostCard } from '@/components/PostCard';
import { JsonLd, blogSchema } from '@/lib/jsonld';
import { getRenderablePosts } from '@/lib/blog';
import { blog } from '@/content/blog';

export const metadata: Metadata = {
  title: blog.title,
  description: blog.description,
  alternates: {
    canonical: '/blog/',
    types: { 'application/rss+xml': '/feed.xml' },
  },
  openGraph: {
    type: 'website',
    url: '/blog/',
    title: blog.title,
    description: blog.description,
  },
};

export default async function BlogIndexPage() {
  const posts = await getRenderablePosts();

  return (
    <>
      <JsonLd data={blogSchema(posts)} />

      <section className="relative overflow-hidden border-b border-line">
        <SparkField density={30} seed={41} />
        <Container className="relative py-16 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
            {blog.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl">
            {blog.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
            {blog.intro}
          </p>
        </Container>
      </section>

      <Section>
        {posts.length === 0 ? (
          <p className="max-w-2xl text-lg leading-relaxed text-ink-muted">
            {blog.emptyState}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
