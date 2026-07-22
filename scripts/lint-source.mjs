import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const failures = []

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) out.push(...walk(path))
    else out.push(path)
  }
  return out
}

function rel(path) {
  return relative(root, path).replace(/\\/g, '/')
}

function fail(path, message) {
  failures.push(`${path}: ${message}`)
}

const requiredFiles = [
  'README.md',
  'package.json',
  'src/components/AppShell.jsx',
  'src/data/genealogy.js',
  'src/data/lunar.js',
]

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) fail(file, 'required file is missing')
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
for (const script of ['dev', 'build', 'test', 'lint', 'check', 'preview']) {
  if (!packageJson.scripts?.[script]) fail('package.json', `missing "${script}" script`)
}

const readme = readFileSync(join(root, 'README.md'), 'utf8').trim()
if (readme.length < 500) fail('README.md', 'project documentation is too thin')

const sourceFiles = [
  ...walk(join(root, 'src')),
  ...walk(join(root, 'scripts')).filter((path) => !path.endsWith('lint-source.mjs')),
  join(root, 'README.md'),
  join(root, 'package.json'),
].filter((path) => /\.(js|jsx|mjs|json|md)$/.test(path))

const sourceChecks = [
  { re: /^<{7} |^={7}$|^>{7} /m, message: 'merge conflict marker found' },
  { re: /\bdebugger\b/, message: 'debugger statement found' },
  { re: /curLunarYear\s*=\s*2025|CUR_LUNAR\s*=\s*2025/, message: 'hard-coded lunar year found' },
]

for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8')
  for (const check of sourceChecks) {
    if (check.re.test(text)) fail(rel(file), check.message)
  }
}

if (failures.length) {
  console.error(`Source lint failed with ${failures.length} issue(s):`)
  for (const item of failures) console.error(`- ${item}`)
  process.exitCode = 1
} else {
  console.log('Source lint passed.')
}
