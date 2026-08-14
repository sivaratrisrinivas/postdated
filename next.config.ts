import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next 16's CLI typecheck path is currently incompatible with this
    // repository's TypeScript 5.9 configuration; use the compiler API instead.
    useTypeScriptCli: false,
    webpackBuildWorker: false,
  },
};

export default nextConfig;
