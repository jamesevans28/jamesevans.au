/**
 * ⚠️ PLACEHOLDER TESTIMONIALS — NOT REAL QUOTES.
 * These exist so layout and tone are right. They MUST be replaced with real,
 * permissioned quotes — or the section removed — before launch. Fabricated
 * testimonials cannot go live. Each is flagged `placeholder: true`; the
 * testimonials section renders a visible notice while any remain.
 */

export type Testimonial = {
  quote: string;
  name: string;
  title: string;
  placeholder: boolean;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      'James built Audify from a whiteboard sketch into the platform our national contracts run on. Years later, he is still the first call we make.',
    name: 'Director',
    title: 'Kairos Strategies',
    placeholder: true,
  },
  {
    quote:
      'He sorted out our systems in a weekend — then explained everything in plain English.',
    name: 'Small-business owner',
    title: 'Melbourne',
    placeholder: true,
  },
  {
    quote:
      'The rare engineering leader who still ships code, and makes everyone around him better.',
    name: 'Former colleague',
    title: 'Telstra',
    placeholder: true,
  },
];

export const hasPlaceholderTestimonials = testimonials.some(
  (t) => t.placeholder,
);
