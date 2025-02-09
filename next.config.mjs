/** @type {import('next').NextConfig} */
const nextConfig = {
    // Silence warnings
    // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
    webpack: (config) => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      config.resolve.fallback = { fs:false };
      config.resolve.alias["node:async_hooks"] = false;
      return config;
    },
  };
  
  export default nextConfig;
  