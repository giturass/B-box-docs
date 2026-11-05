// Parse examples only; Node syntax validation does not assert Goja host behavior.
import { readFileSync, readdirSync } from 'node:fs'
import { Script } from 'node:vm'

const directory = new URL('../docs/public/examples/', import.meta.url)
let count = 0
function validate(source, name) {
  new Script(source, { filename: name })
  count++
}
for (const file of readdirSync(directory)) {
  const content = readFileSync(new URL(file, directory), 'utf8')
  if (file.endsWith('.js')) validate(content, file)
  if (!file.endsWith('.json')) continue
  const scripts = JSON.parse(content).experimental?.scripts
  if (!scripts) continue
  for (const rule of [...(scripts.http || []), ...(scripts.cron || [])]) {
    if (rule.source) validate(rule.source, `${file}:${rule.name}`)
  }
  for (const [name, resource] of Object.entries(scripts.resources || {})) {
    if (resource.data_type === 'text') validate(resource.data, `${file}:${name}`)
  }
}
console.log(`OK: ${count} JavaScript examples parse (syntax only)`)
