/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'argon2'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

