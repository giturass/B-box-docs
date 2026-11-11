export function resolveDeployment(env = process.env) {
  const isVercel = env.VERCEL === '1'
  const base = isVercel ? '/' : '/B-box-docs/'
  const host = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL
  const siteURL = env.DOCS_SITE_URL || (isVercel
    ? (host ? `https://${host}` : '')
    : 'https://giturass.github.io')

  if (!siteURL) {
    throw new Error('Enable Vercel System Environment Variables or set DOCS_SITE_URL to the site origin.')
  }
  const url = new URL(siteURL)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('DOCS_SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.')
  }

  return {
    base,
    origin: url.origin,
    noIndex: isVercel && env.VERCEL_ENV !== 'production',
  }
}
