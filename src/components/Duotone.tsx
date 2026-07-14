import Image from 'next/image';
import { cn } from '@/lib/cn';

/**
 * Wraps an image in the Voltage duotone treatment: grayscale base + a volt
 * multiply overlay, so any photo becomes an on-brand asset. Hover restores
 * full colour as a micro-delight. `variant="cutout"` renders a circular
 * cutout on a citrus field (used in the hero close, About, and OG image).
 */

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  variant?: 'default' | 'cutout';
  priority?: boolean;
  sizes?: string;
};

export function Duotone({
  src,
  alt,
  width,
  height,
  className,
  variant = 'default',
  priority = false,
  sizes,
}: Props) {
  if (variant === 'cutout') {
    return (
      <div
        className={cn(
          'relative grid aspect-square place-items-center overflow-hidden rounded-[var(--radius-card)] bg-citrus',
          className,
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className="size-[74%] rounded-full object-cover grayscale contrast-[1.06]"
        />
        <span
          aria-hidden="true"
          className="absolute size-[74%] rounded-full"
          style={{ boxShadow: 'inset 0 0 0 200px rgba(35,55,255,0.28)' }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-card)]',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className="h-full w-full object-cover grayscale contrast-[1.06] transition-[filter] duration-500 group-hover:grayscale-0"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-volt opacity-[0.72] mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0"
      />
    </div>
  );
}
