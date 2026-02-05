/** @type {import('next').NextConfig} */
const nextConfig = {
  // 只在生产环境使用路径前缀
  basePath: process.env.NODE_ENV === 'production' ? '/deep_research_show' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/deep_research_show' : '',
};

export default nextConfig;
