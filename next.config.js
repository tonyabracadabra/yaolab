const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        "fs-extra": false,
        xmlhttprequest: false,
        child_process: false,
        crypto: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
      };
    }

    if (isServer) {
      config.externals = [...(config.externals || []), "aframe"];
    }

    return config;
  },
};

module.exports = withNextIntl(nextConfig);
