import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nightcap/scene'],
  agentRules: false,
  devIndicators: false,
}

export default config
