/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "e4tchmxe7stjffhy.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      // Keep any existing image domains/patterns you have
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.allfreechips.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
