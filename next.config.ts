import type { NextConfig } from "next";
const config: NextConfig = {
  allowedDevOrigins: ["terminal.local"],
  output: "export",
  trailingSlash: true,
};
export default config;
