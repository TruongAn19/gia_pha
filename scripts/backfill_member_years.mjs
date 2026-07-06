import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { deriveYears } from '../src/data/genealogy.js'

const PAGE_SIZE = 1000
const DRY_RUN = !process.argv.includes('--apply')

function readEnv(path = '.env') {
  const out = {}
  const text = fs.readFileSync(path, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function normalizeUrl(raw) {
  let url = (raw || '').trim().replace(/\/+$/, '')
  if (url.endsWith('/rest/v1')) url = url.slice(0, -'/rest/v1'.length)
  return url
}

function empty(value) {
  return value == null || String(value).trim() === ''
}

function yearValue(value) {
  return value == null ? null : String(value)
}

async function fetchAllMembers(supabase) {
  const all = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('members')
      .select(
        'id,name,generation,death_anniversary,details,birth_year,death_year'
      )
      .order('generation', { ascending: true })
      .order('name', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    all.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}

async function main() {
  const env = readEnv()
  const url = normalizeUrl(env.SUPABASE_URL || env.VITE_SUPABASE_URL)
  const key = env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL/SUPABASE_SERVICE_KEY in .env')
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const rows = await fetchAllMembers(supabase)
  const updates = []
  let hasBirth = 0
  let hasDeath = 0
  let skippedExistingBirth = 0
  let skippedExistingDeath = 0

  for (const row of rows) {
    // Only derive from source text/date fields, never from already-filled DB years.
    const derived = deriveYears({ ...row, birth_year: null, death_year: null })
    const patch = {}

    if (derived.birth_lunar_year != null) {
      hasBirth += 1
      if (empty(row.birth_year)) patch.birth_year = yearValue(derived.birth_lunar_year)
      else skippedExistingBirth += 1
    }

    if (derived.death_lunar_year != null) {
      hasDeath += 1
      if (empty(row.death_year)) patch.death_year = yearValue(derived.death_lunar_year)
      else skippedExistingDeath += 1
    }

    if (Object.keys(patch).length) updates.push({ row, patch })
  }

  console.log(`Mode: ${DRY_RUN ? 'dry-run' : 'apply'}`)
  console.log(`Members in DB: ${rows.length}`)
  console.log(`Rows with source birth_year: ${hasBirth}`)
  console.log(`Rows with source death_year: ${hasDeath}`)
  console.log(`Skipped existing birth_year: ${skippedExistingBirth}`)
  console.log(`Skipped existing death_year: ${skippedExistingDeath}`)
  console.log(`Rows to update: ${updates.length}`)
  console.log(
    `Field updates: birth_year=${updates.filter((u) => u.patch.birth_year).length}, death_year=${
      updates.filter((u) => u.patch.death_year).length
    }`
  )

  for (const { row, patch } of updates.slice(0, 12)) {
    console.log(`${row.name} (doi ${row.generation}): ${JSON.stringify(patch)}`)
  }

  if (DRY_RUN) return

  let done = 0
  for (const { row, patch } of updates) {
    const { error } = await supabase.from('members').update(patch).eq('id', row.id)
    if (error) throw new Error(`${row.name}: ${error.message}`)
    done += 1
    if (done % 50 === 0 || done === updates.length) {
      console.log(`Updated ${done}/${updates.length}`)
    }
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
