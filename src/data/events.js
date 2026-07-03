/**
 * Sự kiện & Giỗ — CHỈ các dịp cấp dòng họ (giỗ từng hộ do gia đình tự lo, không đưa vào đây):
 *   • Giỗ đời đầu (Thủy tổ – đời 1)
 *   • Giỗ Đức Vua Ngô Quyền (Tiền Ngô Vương – Thủy tổ họ Ngô Việt Nam)
 *   • Tết Thanh Minh (tiết khí dương lịch)
 *   • Sự kiện họ tự nhập (nút "Thêm sự kiện")
 * Quy đổi âm lịch / tiết khí -> dương lịch để sắp lịch và đếm ngược.
 */
import { allMembers, normalizeDeathAnniversary, removeDiacritics } from './genealogy'
import { supabase } from '../lib/supabase'
import { nextSolarForLunar, nextThanhMinh, daysUntil, solarToLunar, lunarMonthShort } from './lunar'

const MONTH_NAME = { giêng: 1, chap: 12, 'chạp': 12 }

// Giỗ Đức Vua Ngô Quyền — ngày âm lịch (18 tháng Giêng, ngày mất năm 944).
// Sửa tại đây nếu dòng họ dùng ngày khác.
const NGO_QUYEN = { lunarDay: 18, lunarMonth: 1 }

/** Lấy các sự kiện họ tự nhập từ Supabase. */
export async function fetchEvents() {
  const { data, error } = await supabase.from('events').select('*').order('lunar_month').order('lunar_day')
  if (error) {
    console.error('[events] fetch error:', error)
    return []
  }
  return (data || []).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    place: e.place,
    lunarDay: e.lunar_day,
    lunarMonth: e.lunar_month,
  }))
}

/** Thêm 1 sự kiện họ vào Supabase. */
export async function addEvent(e) {
  const row = {
    title: e.title?.trim() || 'Sự kiện dòng họ',
    category: e.category?.trim() || 'Sự kiện họ',
    place: e.place?.trim() || '',
    lunar_day: Number(e.lunarDay) || 1,
    lunar_month: Number(e.lunarMonth) || 1,
  }
  const { data, error } = await supabase.from('events').insert(row).select().single()
  if (error) throw error
  return data
}

/** "25-08" -> {day:25,month:8}; "19-Giêng" -> {day:19,month:1} */
export function parseLunarDate(dateStr) {
  const mt = (dateStr || '').match(/^(\d{1,2})-(\S+)/)
  if (!mt) return null
  const day = parseInt(mt[1], 10)
  let month = parseInt(mt[2], 10)
  if (isNaN(month)) month = MONTH_NAME[removeDiacritics(mt[2])] ?? null
  if (!day || !month) return null
  return { day, month }
}

const lunarBadge = (day, month) => ({ big: String(day).padStart(2, '0'), small: `${lunarMonthShort(month)} ÂL` })
const solarBadge = (d) => ({ big: String(d.getDate()).padStart(2, '0'), small: `Th.${d.getMonth() + 1}` })

/**
 * Dựng danh sách sự kiện sắp tới (đã quy đổi dương lịch, sắp theo ngày gần nhất).
 * kind: 'ancestor' (Giỗ Tổ đời đầu) | 'king' (Vua Ngô Quyền) | 'thanhminh' | 'event'
 */
export function buildAgenda(from = new Date(), customEvents = []) {
  const items = []

  // 1) Giỗ đời đầu (Thủy tổ, generation === 1)
  for (const m of allMembers()) {
    if (Number(m.generation) !== 1) continue
    const da = normalizeDeathAnniversary(m.death_anniversary)
    if (!da || !da.date) continue
    const lun = parseLunarDate(da.date)
    if (!lun) continue
    const solar = nextSolarForLunar(lun.day, lun.month, from)
    if (!solar) continue
    items.push({
      id: `gio-${m.id_temp}`,
      kind: 'ancestor',
      title: `Giỗ Tổ — ${m.name}`,
      memberId: m.id_temp,
      generation: m.generation,
      lunar: lun,
      badge: lunarBadge(lun.day, lun.month),
      solar,
      days: daysUntil(solar, from),
    })
  }

  // 2) Giỗ Đức Vua Ngô Quyền
  {
    const solar = nextSolarForLunar(NGO_QUYEN.lunarDay, NGO_QUYEN.lunarMonth, from)
    if (solar) {
      const lun = { day: NGO_QUYEN.lunarDay, month: NGO_QUYEN.lunarMonth }
      items.push({
        id: 'gio-ngo-quyen',
        kind: 'king',
        title: 'Giỗ Đức Vua Ngô Quyền',
        subtitle: 'Tiền Ngô Vương · Thủy tổ họ Ngô Việt Nam',
        lunar: lun,
        badge: lunarBadge(lun.day, lun.month),
        solar,
        days: daysUntil(solar, from),
      })
    }
  }

  // 3) Tết Thanh Minh (tiết khí dương lịch)
  {
    const solar = nextThanhMinh(from)
    if (solar) {
      const lun = solarToLunar(solar)
      items.push({
        id: 'thanh-minh',
        kind: 'thanhminh',
        title: 'Tết Thanh Minh',
        subtitle: 'Tảo mộ, tưởng nhớ Tổ tiên',
        solarTerm: true,
        lunar: { day: lun.day, month: lun.month },
        badge: solarBadge(solar),
        solar,
        days: daysUntil(solar, from),
      })
    }
  }

  // 4) Sự kiện họ tự nhập (đã tải từ Supabase)
  for (const e of customEvents) {
    const solar = nextSolarForLunar(e.lunarDay, e.lunarMonth, from)
    if (!solar) continue
    items.push({
      id: e.id,
      kind: 'event',
      title: e.title,
      category: e.category,
      place: e.place,
      lunar: { day: e.lunarDay, month: e.lunarMonth },
      badge: lunarBadge(e.lunarDay, e.lunarMonth),
      solar,
      days: daysUntil(solar, from),
    })
  }

  items.sort((a, b) => a.solar - b.solar)
  return items
}

export { solarToLunar }
