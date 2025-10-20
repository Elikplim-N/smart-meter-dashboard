import type { NextConfig } from "next";

const isGhPages = process.env.GH_PAGES === "true";
const repoName = "smart-meter-dashboard";

const nextConfig: NextConfig = {
  ...(isGhPages
    ? {
        output: "export",
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
