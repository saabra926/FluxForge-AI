/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Allow larger API payloads for image uploads
  api: {
    bodyParser: { sizeLimit: "10mb" },
    responseLimit: false,
  },
};

export default nextConfig;
