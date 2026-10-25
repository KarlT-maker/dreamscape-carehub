import type { NextConfig } from "next";

const repository = "dreamscape-carehub";
const forGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.BARN_BASE_PATH || (forGitHubPages ? `/${repository}` : "");

const config: NextConfig = {
  allowedDevOrigins: ["terminal.local"],
  output: "export",
  trailingSlash: true,
  ...(basePath
    ? { basePath, assetPrefix: `${basePath}/` }
    : {}),
};

export default config;
