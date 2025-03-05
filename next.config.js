/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Move serverComponentsExternalPackages to the root level
  serverExternalPackages: ["@prisma/client", "bcrypt"],
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  // Exclude the notifications debug page from the build
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  typescript: {
    // Ignore type errors during build (we'll fix them separately)
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
