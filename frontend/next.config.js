/** @type {import('next').NextConfig} */
const nextConfig = {
  // This app's public /jobs pages get reverse-proxied under a sub-path on
  // cat-cons.com (see that repo's next.config.js rewrites). Without this,
  // the browser requests JS/CSS from the PROXYING domain
  // (cat-cons.com/_next/static/...) instead of this app's real deployment,
  // where those files don't exist — resulting in a fully unstyled page.
  // assetPrefix forces every static asset URL to be absolute and point
  // here, regardless of what domain actually served the HTML.
  assetPrefix: process.env.ASSET_PREFIX || undefined,
};

module.exports = nextConfig;
