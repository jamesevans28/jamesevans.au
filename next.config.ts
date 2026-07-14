import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fully static, prerendered HTML — deploys as plain files to S3/CloudFront.
  output: 'export',
  // CloudFront serves /path/index.html for extensionless URLs (see CloudFront
  // Function in infra/), so emit trailing-slash directories to match.
  trailingSlash: true,
  images: {
    // next/image optimization needs a server; static export has none.
    unoptimized: true,
  },
  // Fail the production build on type errors rather than shipping them.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Silence the workspace-root inference warning caused by a stray parent
  // lockfile; this project is the root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
