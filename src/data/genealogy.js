// =============================================================================
// genealogy.js — Module dữ liệu gia phả (Bước 1)
// Theo DATA_NOTES.md. members.json là OCR -> BẨN: dò MỀM, không parse cứng.
// Khóa = id_temp (KHÔNG dùng name). Cây dựng từ parent_id_temp.
// Môi trường: ESM thuần, dùng được cả ở Vite (browser) lẫn Node (test).
//   - loadMembers(arr) nhận MẢNG members (app: import members.json; test: đọc file).
// =============================================================================

// ---------- Tiện ích chuỗi ----------

/** Bỏ dấu tiếng Việt + lowercase (cho tìm kiếm diacritic-insensitive). */
export function removeDiacritics(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------- Chuẩn hóa ngày giỗ ----------
// death_anniversary bẩn: bị cắt "(Âm", lẫn "Mộ…". Chỉ lấy token ngày ở đầu.
/**
 * @returns {null | {raw, date, display, note}}
 *  - date: "29-05" (ngày-tháng âm), display: "29-05 (Âm lịch)"
 *  - note: phần đuôi (thường là mộ phần) hoặc null
 */
export function normalizeDeathAnniversary(raw) {
  if (!raw || !raw.trim()) return null
  const m = raw.match(/^\s*(\d{1,2})-([^\s().,;]+)/) // ^\d{1,2}-<tháng>
  if (!m) return { raw, date: null, display: null, note: raw.trim() }
  const date = `${m[1]}-${m[2]}`
  let rest = raw.slice(m[0].length)
  // bỏ phần "(Âm lịch)" / "(Âm" bị cắt + dấu câu dẫn đầu
  rest = rest.replace(/^\s*\(\s*Âm\s*l[ịi]ch\s*\)?/i, '').replace(/^\s*\(\s*Âm\s*$/i, '')
  rest = rest.replace(/^[\s.,;:)-]+/, '').trim()
  return { raw, date, display: `${date} (Âm lịch)`, note: rest || null }
}

// ---------- Dò mềm trong details (free-text OCR) ----------
/**
 * @returns {{
 *   thuy, tu, hasWife, polygamy, chanhThat, thuThat:[],
 *   sonsText, daughtersText, longevity, isLost
 * }}
 */
export function parseDetails(text) {
  const t = text || ''
  const grab = (re) => {
    const m = t.match(re)
    return m ? m[1].trim() : null
  }
  const num = (re) => {
    const m = t.match(re)
    return m ? parseInt(m[1], 10) : null
  }
  // tên thụy / tự nằm trong ngoặc
  const thuy = grab(/\(\s*(?:Tên\s+)?th[ụu]y\s*[:：]?\s*([^)]+)\)/i)
  const tu = grab(/\(\s*(?:Tên\s+)?t[ựu]\s*[:：]?\s*([^)]+)\)/i)
  // vợ
  const chanhThat = grab(/Bà\s+chánh\s+thất\s*[:：]?\s*([^.\n]+)/i)
  const thuThat = []
  const reThu = /Bà\s+thứ\s+thất\s*[:：]?\s*([^.\n]+)/gi
  let mm
  while ((mm = reThu.exec(t)) !== null) thuThat.push(mm[1].trim())
  // con (chỉ để tham khảo — SỐ CON THẬT đếm từ parent_id_temp)
  const sonsText = num(/(\d+)\s*con\s*trai/i)
  const daughtersText = num(/(\d+)\s*con\s*gái/i)
  // hưởng thọ
  const longevity = num(/(?:Hưởng\s+)?th[ọo]\s+(\d+)\s*tu[ổo]i/i)
  // thất lạc
  const isLost = /không\s+thấy\s+tin\s+tức|thất\s+lạc|biệt\s+tích/i.test(t)
  return {
    thuy,
    tu,
    hasWife: !!(chanhThat || thuThat.length),
    polygamy: thuThat.length > 0,
    chanhThat,
    thuThat,
    sonsText,
    daughtersText,
    longevity,
    isLost,
  }
}

// ---------- Quy đổi năm âm ----------
// Niên hiệu -> năm bắt đầu (DATA_NOTES §4)
export const NIEN_HIEU = {
  'gia long': 1802,
  'minh mạng': 1820,
  'minh mệnh': 1820,
  'thiệu trị': 1841,
  'tự đức': 1848,
  'hiệp hòa': 1883,
  'kiến phúc': 1884,
  'hàm nghi': 1885,
  'đồng khánh': 1886,
  'thành thái': 1889,
  'duy tân': 1907,
  'khải định': 1916,
  'bảo đại': 1926,
}

const CAN = ['giáp', 'ất', 'bính', 'đinh', 'mậu', 'kỷ', 'canh', 'tân', 'nhâm', 'quý']
const CHI = ['tý', 'sửu', 'dần', 'mão', 'thìn', 'tỵ', 'ngọ', 'mùi', 'thân', 'dậu', 'tuất', 'hợi']

/** Năm 4 (CN) = Giáp Tý (index 0 của vòng 60). */
function canChiIndex(can, chi) {
  // so khớp không phân biệt dấu (CAN/CHI có dấu, tham số có thể đã bỏ dấu)
  const ci = CAN.map(removeDiacritics).indexOf(removeDiacritics(can))
  const zi = CHI.map(removeDiacritics).indexOf(removeDiacritics(chi))
  if (ci < 0 || zi < 0) return -1
  // tìm offset 0..59 sao cho %10==ci và %12==zi
  for (let k = 0; k < 60; k++) if (k % 10 === ci && k % 12 === zi) return k
  return -1
}

/** Các năm dương ứng với 1 tên can-chi trong [lo, hi]. */
export function canChiYears(can, chi, lo = 1700, hi = 2100) {
  const idx = canChiIndex(removeDiacritics(can), removeDiacritics(chi))
  if (idx < 0) return []
  const out = []
  // năm y thỏa (y - 4) %60 === idx
  let start = lo + ((idx - ((lo - 4) % 60) + 60) % 60)
  for (let y = start; y <= hi; y += 60) out.push(y)
  return out
}

/**
 * Quy đổi 1 chuỗi (niên hiệu / can chi / số năm) -> năm âm (số).
 * @param raw chuỗi nguồn (vd "Minh Mạng thứ 6", "Giáp Tý", "1937")
 * @param hintYear (tùy chọn) năm tham chiếu để chọn đúng thế kỷ cho can-chi
 * @returns {null | {year, method, candidates?}}
 */
export function toLunarYear(raw, hintYear = null) {
  if (!raw) return null
  const s = raw.toString()
  const low = removeDiacritics(s)

  // 1) Niên hiệu + (thứ/năm) N   (low đã bỏ dấu: "thứ"->"thu", "năm"->"nam")
  for (const key of Object.keys(NIEN_HIEU)) {
    const k = removeDiacritics(key)
    if (!low.includes(k)) continue
    const base = NIEN_HIEU[key]
    // chỉ nhận số khi có "thu"/"nam" ngay sau niên hiệu (tránh vớ nhầm ngày tháng)
    const mN = low.match(new RegExp(k + '\\s*(?:thu|nam)\\s*(\\d{1,3})'))
    if (mN) return { year: base + (parseInt(mN[1], 10) - 1), method: 'nien_hieu' }
    return { year: base, method: 'nien_hieu_only' } // niên hiệu đơn -> năm đầu
  }

  // 2) Năm dương tường minh (1600–2099)
  const my = low.match(/\b(1[6-9]\d\d|20\d\d)\b/)
  if (my) return { year: parseInt(my[1], 10), method: 'year' }

  // 3) Can chi
  const tokens = low.replace(/[^a-zếệ\s]/g, ' ').split(/\s+/)
  for (let i = 0; i < tokens.length - 1; i++) {
    if (CAN.map(removeDiacritics).includes(tokens[i]) && CHI.map(removeDiacritics).includes(tokens[i + 1])) {
      const cands = canChiYears(tokens[i], tokens[i + 1])
      if (!cands.length) continue
      if (hintYear != null) {
        const best = cands.reduce((a, b) => (Math.abs(b - hintYear) < Math.abs(a - hintYear) ? b : a))
        return { year: best, method: 'can_chi', candidates: cands }
      }
      return { year: null, method: 'can_chi', candidates: cands } // cần ngữ cảnh để chọn
    }
  }
  return null
}

// ---------- Tuổi / Hưởng thọ (DATA_NOTES §4) ----------
/**
 * @param m {birth_lunar_year, death_lunar_year, longevity}
 * @param curLunarYear năm âm hiện tại
 */
export function getLifespan(m, curLunarYear) {
  // §8.1: "Thất lạc" là tầng trạng thái ƯU TIÊN cao nhất -> không tính hưởng thọ
  if (m.isLost) return { label: 'Tình trạng', value: 'Thất lạc' }
  const b = m.birth_lunar_year
  const d = m.death_lunar_year
  const tho = m.longevity
  // "đã mất" = có năm mất HOẶC có "thọ N" HOẶC cờ isDeceased (vd có ngày giỗ)
  const deceased = m.isDeceased || d != null || tho != null
  if (!deceased) {
    return b
      ? { label: 'Tuổi', value: curLunarYear - b + 1 }
      : { label: 'Tuổi', value: 'Chưa xác định' }
  }
  if (b && d) return { label: 'Hưởng thọ', value: d - b + 1 }
  if (tho != null) return { label: 'Hưởng thọ', value: tho }
  return { label: 'Hưởng thọ', value: 'Chưa xác định' }
}

// =============================================================================
// Kho dữ liệu có chỉ mục (state ở module)
// =============================================================================

let _members = []
let _byId = new Map()
let _childrenOf = new Map() // parent_id_temp -> [member]

/** Dựng lại các chỉ mục từ _members. */
function buildIndex() {
  _byId = new Map(_members.map((m) => [m.id_temp, m]))
  _childrenOf = new Map()
  for (const m of _members) {
    const p = m.parent_id_temp
    if (p == null) continue
    if (!_childrenOf.has(p)) _childrenOf.set(p, [])
    _childrenOf.get(p).push(m)
  }
  for (const list of _childrenOf.values()) {
    list.sort(
      (a, b) =>
        (a.generation ?? 999) - (b.generation ?? 999) ||
        (a.name || '').localeCompare(b.name || '', 'vi')
    )
  }
}

/** Khởi tạo từ MẢNG members (đọc từ members.json). Trả về số bản ghi. */
export function loadMembers(arr) {
  _members = Array.isArray(arr) ? arr : []
  buildIndex()
  return _members.length
}

export function allMembers() {
  return _members
}

/** Tạo id_temp slug duy nhất từ tên. */
function makeId(name) {
  const base = removeDiacritics(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'thanh-vien'
  let id = base
  let i = 2
  while (_byId.has(id)) id = `${base}-${i++}`
  return id
}

/**
 * Thêm thành viên (IN-MEMORY trong phiên — chưa ghi xuống Supabase/members.json).
 * data: {name, han_name, generation, death_anniversary, grave, details,
 *        photo_url, parent_id_temp, birth_year, death_year, gender}
 */
export function addMember(data) {
  const m = {
    id_temp: makeId(data.name || ''),
    name: data.name || '',
    han_name: data.han_name || null,
    generation: data.generation ?? null,
    death_anniversary: data.death_anniversary || null,
    grave: data.grave || null,
    details: data.details || '',
    photo_url: data.photo_url || null,
    parent_id_temp: data.parent_id_temp ?? null,
    birth_year: data.birth_year || null,
    death_year: data.death_year || null,
    is_deceased: data.is_deceased ?? null, // true|false|null(chưa xác định -> suy từ dữ liệu)
    gender: data.gender || null,
  }
  _members.push(m)
  buildIndex()
  return m
}

/** Cập nhật thành viên theo id_temp (in-memory). */
export function updateMember(id, patch) {
  const m = _byId.get(id)
  if (!m) return null
  Object.assign(m, patch)
  buildIndex()
  return m
}

export function byId(id) {
  return _byId.get(id) || null
}

/** Con trực tiếp (theo parent_id_temp). */
export function getChildren(id) {
  return _childrenOf.get(id) || []
}

/** Số con CÓ RECORD (con gái lấy chồng thường không có record -> ít hơn details). */
export function countChildren(id) {
  return getChildren(id).length
}

/** Tổ tiên: [cha, ông, ...] tới gốc. Chống lặp vô hạn bằng visited. */
export function getAncestors(id) {
  const out = []
  const seen = new Set([id])
  let cur = byId(id)
  while (cur && cur.parent_id_temp != null) {
    if (seen.has(cur.parent_id_temp)) break
    const p = byId(cur.parent_id_temp)
    if (!p) break // orphan: parent_id_temp trỏ tới id không tồn tại
    out.push(p)
    seen.add(p.id_temp)
    cur = p
  }
  return out
}

/**
 * Gốc cây = không có thân phụ xác định:
 *  - parent_id_temp null  -> gốc thật
 *  - parent_id_temp trỏ tới id KHÔNG tồn tại -> orphan ("Chưa rõ thân phụ")
 * @returns {{roots:[], orphans:[]}}
 */
export function getRoots() {
  const roots = []
  const orphans = []
  for (const m of _members) {
    if (m.parent_id_temp == null) roots.push(m)
    else if (!_byId.has(m.parent_id_temp)) orphans.push(m)
  }
  return { roots, orphans }
}

/** Map<đời, [member]> đã sort theo tên. */
export function groupByGeneration() {
  const g = new Map()
  for (const m of _members) {
    const k = m.generation ?? null
    if (!g.has(k)) g.set(k, [])
    g.get(k).push(m)
  }
  for (const list of g.values()) list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'))
  return new Map([...g.entries()].sort((a, b) => (a[0] ?? 999) - (b[0] ?? 999)))
}

/** Tìm kiếm bỏ dấu trên tên. */
export function searchMembers(query) {
  const q = removeDiacritics(query)
  if (!q) return []
  return _members.filter((m) => removeDiacritics(m.name).includes(q))
}

// ---------- Tổng hợp tiện cho UI ----------
/**
 * Suy ra các trường đời sống cho 1 member từ dữ liệu bẩn:
 * longevity (từ details), death_lunar_year (dò niên hiệu/can-chi/năm trong
 * death_anniversary.note + details), birth_lunar_year (nếu dò được).
 */
export function deriveYears(m) {
  const text = m.details || ''
  const parsed = parseDetails(text)
  const da = normalizeDeathAnniversary(m.death_anniversary)
  const inRange = (y) => y != null && y >= 1600 && y <= 2100

  // NĂM SINH: chỉ lấy từ cụm "Sinh năm ..." (KHÔNG nhầm với năm mất)
  let birth = null
  const by = text.match(/[Ss]inh\s+năm\s+(\d{4})/)
  if (by) birth = parseInt(by[1], 10)
  else {
    const bcc = text.match(/[Ss]inh\s+năm\s+([^\d.,;(][^.,;(]*)/) // "Sinh năm <can chi>"
    if (bcc) {
      const r = toLunarYear(bcc[1])
      if (r?.year) birth = r.year
    }
  }
  if (!inRange(birth)) birth = null

  // Ưu tiên năm nhập tay (thành viên mới): birth_year / death_year
  const explicitBirth = m.birth_year ? parseInt(m.birth_year, 10) : null
  const explicitDeath = m.death_year ? parseInt(m.death_year, 10) : null
  if (inRange(explicitBirth)) birth = explicitBirth

  // ĐÃ MẤT? — ưu tiên cờ tường minh is_deceased (admin chọn);
  // nếu chưa xác định (null/undefined) thì suy từ dữ liệu.
  const deathPhrase =
    /m[ấậ]t\b|t[ạa]\s*th[ếe]|qua\s*đời|t[ừư]\s*tr[ầa]n|hy\s*sinh|qu[áa]\s*c[ốo]|hưởng\s*th[ọo]|th[ọo]\s+\d+\s*tu[ổo]i/i
  const isDeceased =
    m.is_deceased === true
      ? true
      : m.is_deceased === false
        ? false
        : explicitDeath != null || !!da || deathPhrase.test(text)

  // NĂM MẤT: chỉ tính khi đã mất. Ưu tiên nhập tay; nếu không, dò trong "mất/tạ thế..."
  let death = isDeceased && inRange(explicitDeath) ? explicitDeath : null
  if (death == null && isDeceased) {
    const seg = text.match(/(?:m[ấậ]t|t[ạa]\s*th[ếe]|qua\s*đời|t[ừư]\s*tr[ầa]n|hy\s*sinh)\b([^.]*)/i)
    if (seg) {
      const r = toLunarYear(seg[1]) // năm dương / niên hiệu trong cụm đó
      if (r?.year) death = r.year
    }
    if (!inRange(death)) death = null
  }

  return {
    birth_lunar_year: birth,
    death_lunar_year: death,
    isDeceased,
    isLost: parsed.isLost,
    longevity: parsed.longevity,
  }
}

// ---------- §8.2: Thông tin con + cờ chất lượng dữ liệu ----------
/**
 * Số con tin theo RECORD (parent_id_temp). §8.2:
 *  - missingSonRecords (ACTIONABLE, 1 chiều) = recordSons < sonsText
 *    (gia phả nhắc con trai mà chưa có hồ sơ -> "Cần bổ sung").
 *  - detailsCountUnreliable (ưu tiên THẤP) = recordSons > sonsText
 *    (details OCR đếm thiếu; record mới đúng -> không có gì để bổ sung).
 *  - daughterNote: "+N con gái (theo gia phả, chưa có hồ sơ)".
 * recordSons ước lượng bằng cách loại con gái (tên có "Thị").
 */
export function getChildrenInfo(id) {
  const m = byId(id)
  const recordChildren = getChildren(id)
  const recordCount = recordChildren.length
  const recordSons = recordChildren.filter((c) => !/\bThị\b/i.test(c.name || '')).length
  const recordDaughters = recordCount - recordSons

  const p = m ? parseDetails(m.details) : {}
  const sonsText = p.sonsText ?? null
  const daughtersText = p.daughtersText ?? null

  // CỜ một chiều (actionable): gia phả có con trai nhưng record còn thiếu.
  const missingSonRecords = sonsText != null && recordSons < sonsText
  // CỜ phụ ưu tiên thấp: record nhiều hơn details -> details đếm thiếu (record đúng).
  const detailsCountUnreliable = sonsText != null && recordSons > sonsText

  // Con gái theo gia phả chưa có hồ sơ.
  const extraDaughters =
    daughtersText != null ? Math.max(0, daughtersText - recordDaughters) : 0
  const daughterNote =
    extraDaughters > 0 ? `+${extraDaughters} con gái (theo gia phả, chưa có hồ sơ)` : null

  return {
    recordCount,
    recordSons,
    recordDaughters,
    recordChildren,
    sonsText,
    daughtersText,
    daughterNote,
    dataQuality: { missingSonRecords, detailsCountUnreliable },
  }
}
