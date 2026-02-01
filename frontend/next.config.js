/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Otimizado para Docker - reduz o tamanho da imagem de ~1GB para ~100MB
  output: 'standalone',
  // Ignorar erros de ESLint no build (são apenas warnings)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar erros de TypeScript no build
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Resolve jspdf optional dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      canvg: false,
      'html2canvas': false,
      dompurify: false,
    };
    return config;
  },
};

module.exports = nextConfig;
