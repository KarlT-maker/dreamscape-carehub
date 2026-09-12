import type { NextConfig } from "next";

const repository = "dreamscape-carehub";
const forGitHubPages = process.env.GITHUB_PAGES === "true";

const config: NextConfig = {
  allowedDevOrigins: ["terminal.local"],
  output: "export",
  trailingSlash: true,
  ...(forGitHubPages
    ? { basePath: `/${repository}`, assetPrefix: `/${repository}/` }
    : {}),
};

export default config;
