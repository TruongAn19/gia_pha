// Test nhanh module genealogy với 4 id mẫu (Bước 1). Chạy: node src/data/genealogy.test.mjs
import { readFileSync } from 'node:fs'
import {
  loadMembers, byId, getChildren, countChildren, getAncestors, getRoots,
  groupByGeneration, searchMembers, normalizeDeathAnniversary, parseDetails,
  toLunarYear, deriveYears, getLifespan, getChildrenInfo, allMembers,
} from './genealogy.js'

const data = JSON.parse(readFileSync(new URL('../../members.json', import.meta.url), 'utf8'))
const n = loadMembers(data)
const CUR_LUNAR = 2025 // năm âm hiện tại (demo; thực tế lấy từ thư viện âm lịch UTC+7)

const line = (s = '') => console.log(s)
line('================= TỔNG QUAN =================')
line(`Tổng bản ghi: ${n}`)
const { roots, orphans } = getRoots()
line(`Gốc thật: ${roots.length} (${roots.map((r) => r.id_temp).join(', ')})`)
line(`Orphan (cha không tồn tại): ${orphans.length}`)
const byGen = groupByGeneration()
line('Phân bố theo đời: ' + [...byGen].map(([g, l]) => `${g}:${l.length}`).join('  '))

line('\n========== TEST toLunarYear (quy đổi) ==========')
for (const s of ['Minh Mạng thứ 6', 'Tự Đức thứ 10', 'Giáp Tý', '1937', 'Quý Sửu 1913']) {
  line(`  "${s}" -> ${JSON.stringify(toLunarYear(s))}`)
}

line('\n========== TEST tìm kiếm bỏ dấu ==========')
line(`  "ngo ba dat" -> ${searchMembers('ngo ba dat').map((m) => m.name).slice(0, 5).join(' | ')}`)

const IDS = ['ngo-phuc-khang', 'ngo-ba-dat', 'ngo-kieu', 'ngo-nghiem']
for (const id of IDS) {
  line('\n=================================================')
  const m = byId(id)
  if (!m) {
    // thử dò theo tên gần đúng nếu id khác
    const guess = data.find((x) => x.id_temp.startsWith(id.slice(0, 10)))
    line(`!! Không thấy id "${id}". Gần nhất: ${guess ? guess.id_temp : '(không có)'}`)
    continue
  }
  const da = normalizeDeathAnniversary(m.death_anniversary)
  const p = parseDetails(m.details)
  const dy = deriveYears(m)
  const life = getLifespan(dy, CUR_LUNAR)
  const anc = getAncestors(id)
  const kids = getChildren(id)

  line(`# ${m.name}  [${id}]`)
  line(`  đời: ${m.generation} | han_name: ${m.han_name ?? '(Chưa có tên Hán → 吳)'}`)
  line(`  ngày giỗ raw : ${JSON.stringify(m.death_anniversary)}`)
  line(`  ngày giỗ dùng: ${da ? da.display : '(Chưa rõ)'}${da && da.note ? '   | ghi chú/mộ: ' + da.note : ''}`)
  line(`  thụy/tự: ${p.thuy || '–'} / ${p.tu || '–'}`)
  line(`  vợ: chánh thất = ${p.chanhThat || '–'} | đa thê: ${p.polygamy} ${p.thuThat.length ? '(thứ thất: ' + p.thuThat.join(' ; ') + ')' : ''}`)
  const ci = getChildrenInfo(id)
  line(`  con (theo details): ${p.sonsText ?? '?'} trai / ${p.daughtersText ?? '?'} gái`)
  line(`  con (record thật)  : ${ci.recordCount} -> ${kids.map((k) => k.name).join(', ') || '(chưa có)'}`)
  if (ci.daughterNote) line(`     ${ci.daughterNote}`)
  line(`  recordSons: ${ci.recordSons} | dataQuality: ${JSON.stringify(ci.dataQuality)}`)
  line(`  hưởng thọ (details): ${p.longevity ?? '–'} | thất lạc: ${p.isLost}`)
  line(`  deriveYears: ${JSON.stringify({ death_lunar_year: dy.death_lunar_year, isDeceased: dy.isDeceased, longevity: dy.longevity })}`)
  line(`  => ${life.label}: ${life.value}`)
  line(`  tổ tiên: ${anc.map((a) => `${a.name}(đời ${a.generation})`).join(' < ') || '(gốc)'}`)
}
// ---------- Kiểm chứng §8 ----------
line('\n========== KIỂM CHỨNG §8 ==========')
const ok = (cond, msg) => line(`  ${cond ? '✓' : '✗ THẤT BẠI'} ${msg}`)

// 8.1: ngo-nghiem (thất lạc) -> "Thất lạc", KHÔNG hưởng thọ
const nghiem = getLifespan(deriveYears(byId('ngo-nghiem')), CUR_LUNAR)
ok(nghiem.label === 'Tình trạng' && nghiem.value === 'Thất lạc',
   `ngo-nghiem getLifespan = ${JSON.stringify(nghiem)} (mong: Tình trạng/Thất lạc)`)

// 8.2: ngo-kieu (record 3 > details 2) -> KHÔNG bật actionable; chỉ cờ phụ
const kieuCI = getChildrenInfo('ngo-kieu')
ok(kieuCI.dataQuality.missingSonRecords === false,
   `ngo-kieu missingSonRecords = ${kieuCI.dataQuality.missingSonRecords} (recordSons ${kieuCI.recordSons} > details ${kieuCI.sonsText})`)
ok(kieuCI.dataQuality.detailsCountUnreliable === true,
   `ngo-kieu detailsCountUnreliable = ${kieuCI.dataQuality.detailsCountUnreliable} (details OCR đếm thiếu)`)
ok(!!kieuCI.daughterNote, `ngo-kieu daughterNote = "${kieuCI.daughterNote}"`)

// đối chứng: ngo-ba-dat recordSons 2 == details 2 -> không cờ nào; có "+4 con gái"
const datCI = getChildrenInfo('ngo-ba-dat')
ok(datCI.dataQuality.missingSonRecords === false && datCI.dataQuality.detailsCountUnreliable === false,
   `ngo-ba-dat dataQuality = ${JSON.stringify(datCI.dataQuality)} (recordSons ${datCI.recordSons} == details ${datCI.sonsText})`)
ok(datCI.daughterNote === '+4 con gái (theo gia phả, chưa có hồ sơ)',
   `ngo-ba-dat daughterNote = "${datCI.daughterNote}"`)

// Thống kê: bao nhiêu member vào danh sách "Cần bổ sung" (missingSonRecords)
const needFix = allMembers().filter((m) => getChildrenInfo(m.id_temp).dataQuality.missingSonRecords)
line(`  • Danh sách "Cần bổ sung" (missingSonRecords): ${needFix.length} thành viên`)

line('\n================= XONG BƯỚC 1 (đã cập nhật §8) =================')
