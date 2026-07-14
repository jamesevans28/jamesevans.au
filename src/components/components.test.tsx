import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteFooter } from './SiteFooter';
import { CaseStudyCard } from './CaseStudyCard';
import { Duotone } from './Duotone';
import { SparkField } from './SparkField';
import { Section, SectionHeading, Eyebrow } from './Section';
import { ServicesGrid } from './ServicesGrid';
import { caseStudies } from '@/content/work';
import { site } from '@/content/site';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// next/image → plain img in tests.
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

describe('SiteFooter', () => {
  it('shows the email, LinkedIn and current-year copyright', () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole('link', { name: site.email }),
    ).toHaveAttribute('href', `mailto:${site.email}`);
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      site.linkedin,
    );
    expect(
      screen.getByText(new RegExp(String(new Date().getFullYear()))),
    ).toBeInTheDocument();
  });
});

describe('CaseStudyCard', () => {
  it('renders the study name, role, outcome and tags', () => {
    const study = caseStudies[0]!;
    render(<CaseStudyCard study={study} />);
    expect(
      screen.getByRole('heading', { name: study.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(study.outcome)).toBeInTheDocument();
    expect(screen.getByText(study.tags[0]!)).toBeInTheDocument();
  });

  it('renders metrics when present', () => {
    const withMetrics = caseStudies.find((c) => c.metrics)!;
    render(<CaseStudyCard study={withMetrics} />);
    expect(
      screen.getByText(withMetrics.metrics![0]!.value),
    ).toBeInTheDocument();
  });
});

describe('Duotone', () => {
  it('renders a default duotone image', () => {
    render(
      <Duotone src="/images/portrait.jpg" alt="Portrait" width={100} height={100} />,
    );
    expect(screen.getByAltText('Portrait')).toBeInTheDocument();
  });

  it('renders the cutout variant', () => {
    const { container } = render(
      <Duotone
        src="/images/portrait.jpg"
        alt="Cutout portrait"
        width={100}
        height={100}
        variant="cutout"
      />,
    );
    expect(screen.getByAltText('Cutout portrait')).toBeInTheDocument();
    // Cutout wraps in a citrus field.
    expect(container.querySelector('.bg-citrus')).toBeInTheDocument();
  });
});

describe('SparkField', () => {
  it('renders a decorative, aria-hidden svg with strokes', () => {
    const { container } = render(<SparkField density={10} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelectorAll('line')).toHaveLength(10);
  });

  it('is deterministic for a given seed', () => {
    const a = render(<SparkField density={5} seed={3} />).container.innerHTML;
    const b = render(<SparkField density={5} seed={3} />).container.innerHTML;
    expect(a).toBe(b);
  });
});

describe('Section', () => {
  it('renders children inside a section', () => {
    render(
      <Section id="test">
        <p>Body</p>
      </Section>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('SectionHeading renders eyebrow, title and intro', () => {
    render(
      <SectionHeading eyebrow="Eyebrow" title="Title" intro="Intro text" />,
    );
    expect(screen.getByText('Eyebrow')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Intro text')).toBeInTheDocument();
  });

  it('SectionHeading omits optional parts cleanly', () => {
    render(<SectionHeading title="Only title" />);
    expect(
      screen.getByRole('heading', { name: 'Only title' }),
    ).toBeInTheDocument();
  });

  it('Eyebrow renders its text', () => {
    render(<Eyebrow>Label</Eyebrow>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });
});

describe('ServicesGrid', () => {
  it('renders all four services with descriptions by default', () => {
    render(<ServicesGrid />);
    expect(
      screen.getByRole('heading', { name: 'Software development' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('links each card to /services/ in teaser mode', () => {
    render(<ServicesGrid teaser />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/services/');
    }
  });
});
