import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveDeployment } from '../docs/.vitepress/deployment.mjs'

test('Pages retains its project path and public origin', () => {
  assert.deepEqual(resolveDeployment({}), {
    base: '/B-box-docs/', origin: 'https://giturass.github.io', noIndex: false,
  })
})

test('Vercel serves from the root and prefers the production domain', () => {
  const deployment = resolveDeployment({
    VERCEL: '1', VERCEL_ENV: 'production',
    VERCEL_PROJECT_PRODUCTION_URL: 'docs.example.test',
    VERCEL_URL: 'deployment.example.test',
  })
  assert.deepEqual(deployment, { base: '/', origin: 'https://docs.example.test', noIndex: false })
})

test('a custom domain controls metadata without adding a path prefix', () => {
  assert.deepEqual(resolveDeployment({
    VERCEL: '1', VERCEL_ENV: 'production',
    VERCEL_PROJECT_PRODUCTION_URL: 'project.example.test',
    DOCS_SITE_URL: 'https://guide.example.com/',
  }), { base: '/', origin: 'https://guide.example.com', noIndex: false })
})

test('preview deployments remain unindexed with either Vercel domain', () => {
  const preview = { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_URL: 'preview.example.test' }
  assert.deepEqual(resolveDeployment(preview), {
    base: '/', origin: 'https://preview.example.test', noIndex: true,
  })
  assert.deepEqual(resolveDeployment({ ...preview, VERCEL_PROJECT_PRODUCTION_URL: 'docs.example.test' }), {
    base: '/', origin: 'https://docs.example.test', noIndex: true,
  })
})

test('missing or invalid site origins fail before publishing incorrect metadata', () => {
  assert.throws(() => resolveDeployment({ VERCEL: '1' }), /System Environment Variables/)
  for (const value of ['https://example.test/subpath', 'https://example.test/?query=1', 'https://example.test/#fragment', 'ftp://example.test']) {
    assert.throws(() => resolveDeployment({ DOCS_SITE_URL: value }), /must be an HTTP\(S\) origin/)
  }
})
