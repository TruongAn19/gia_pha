/**
 * Âm lịch Việt Nam — thuật toán Hồ Ngọc Đức (public domain).
 * Dùng để quy đổi ngày giỗ (âm lịch) sang dương lịch cho từng năm.
 */
const TZ = 7 // múi giờ Việt Nam

function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12)
  const y = yy + 4800 - a
  const m = mm + 12 * a - 3
  let jd =
    dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083
  return jd
}

function jdToDate(jd) {
  let a, b, c
  if (jd > 2299160) {
    a = jd + 32044
    b = Math.floor((4 * a + 3) / 146097)
    c = a - Math.floor((b * 146097) / 4)
  } else {
    b = 0
    c = jd + 32082
  }
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)
  const day = e - Math.floor((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * Math.floor(m / 10)
  const year = b * 100 + d - 4800 + Math.floor(m / 10)
  return [day, month, year]
}

function getNewMoonDay(k, timeZone) {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const dr = Math.PI / 180
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M)
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr)
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr)
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr))
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M))
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr))
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M))
  let deltat
  if (T < -11) deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
  else deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
  const JdNew = Jd1 + C1 - deltat
  return Math.floor(JdNew + 0.5 + timeZone / 24)
}

function getSunLongitude(jdn, timeZone) {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525
  const T2 = T * T
  const dr = Math.PI / 180
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)
  let L = L0 + DL
  L = L * dr
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2))
  return Math.floor((L / Math.PI) * 6)
}

function getLunarMonth11(yy, timeZone) {
  const off = jdFromDate(31, 12, yy) - 2415021
  const k = Math.floor(off / 29.530588853)
  let nm = getNewMoonDay(k, timeZone)
  const sunLong = getSunLongitude(nm, timeZone)
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone)
  return nm
}

function getLeapMonthOffset(a11, timeZone) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5)
  let last = 0
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  do {
    last = arc
    i++
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  } while (arc !== last && i < 14)
  return i - 1
}

function convertSolar2Lunar(dd, mm, yy, timeZone) {
  const dayNumber = jdFromDate(dd, mm, yy)
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = getNewMoonDay(k + 1, timeZone)
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone)
  let a11 = getLunarMonth11(yy, timeZone)
  let b11 = a11
  let lunarYear
  if (a11 >= monthStart) {
    lunarYear = yy
    a11 = getLunarMonth11(yy - 1, timeZone)
  } else {
    lunarYear = yy + 1
    b11 = getLunarMonth11(yy + 1, timeZone)
  }
  const lunarDay = dayNumber - monthStart + 1
  const diff = Math.floor((monthStart - a11) / 29)
  let lunarLeap = 0
  let lunarMonth = diff + 11
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
      if (diff === leapMonthDiff) lunarLeap = 1
    }
  }
  if (lunarMonth > 12) lunarMonth = lunarMonth - 12
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1
  return [lunarDay, lunarMonth, lunarYear, lunarLeap]
}

function convertLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap, timeZone) {
  let a11, b11
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone)
    b11 = getLunarMonth11(lunarYear, timeZone)
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone)
    b11 = getLunarMonth11(lunarYear + 1, timeZone)
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853)
  let off = lunarMonth - 11
  if (off < 0) off += 12
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone)
    let leapMonth = leapOff - 2
    if (leapMonth < 0) leapMonth += 12
    if (lunarLeap !== 0 && lunarMonth !== leapMonth) return [0, 0, 0]
    else if (lunarLeap !== 0 || off >= leapOff) off += 1
  }
  const monthStart = getNewMoonDay(k + off, timeZone)
  return jdToDate(monthStart + lunarDay - 1)
}

// ── Tiện ích cấp cao ──────────────────────────────────────────────
const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Dương lịch -> âm lịch: {day, month, year, leap} */
export function solarToLunar(date) {
  const [d, m, y, leap] = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear(), TZ)
  return { day: d, month: m, year: y, leap: !!leap }
}

/**
 * Ngày dương lịch kế tiếp (>= from) ứng với 1 ngày âm lịch (không kèm năm).
 * Trả về Date hoặc null.
 */
export function nextSolarForLunar(lunarDay, lunarMonth, from = new Date()) {
  if (!lunarDay || !lunarMonth) return null
  const base = stripTime(from)
  const startLY = solarToLunar(base).year
  for (let ly = startLY - 1; ly <= startLY + 2; ly++) {
    const [d, m, y] = convertLunar2Solar(lunarDay, lunarMonth, ly, 0, TZ)
    if (!d) continue
    const dt = new Date(y, m - 1, d)
    if (dt >= base) return dt
  }
  return null
}

/** Số ngày còn lại từ hôm nay đến 1 ngày dương lịch (làm tròn, chỉ tính theo ngày). */
export function daysUntil(date, from = new Date()) {
  return Math.round((stripTime(date) - stripTime(from)) / 86400000)
}

const WEEKDAY = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const weekdayName = (date) => WEEKDAY[date.getDay()]

/** dd/mm/yyyy */
export function fmtSolar(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()}`
}

const LUNAR_MONTH_LABEL = (m) => (m === 1 ? 'Giêng' : m === 12 ? 'Chạp' : `Th.${m}`)
export const lunarMonthShort = LUNAR_MONTH_LABEL

// Kinh độ mặt trời (độ, 0–360) tại thời điểm jdn — dùng để tính tiết khí.
function sunLongitudeDeg(jdn, timeZone) {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525
  const T2 = T * T
  const dr = Math.PI / 180
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)
  let L = L0 + DL
  L = L - 360 * Math.floor(L / 360)
  return L
}

// Tết Thanh Minh (tiết khí thứ 5, kinh độ mặt trời = 15°) trong 1 năm dương lịch.
function thanhMinhOfYear(y) {
  for (let d = 3; d <= 7; d++) {
    const lon = sunLongitudeDeg(jdFromDate(d, 4, y), TZ)
    if (lon >= 15 && lon < 30) return new Date(y, 3, d)
  }
  return new Date(y, 3, 5) // dự phòng
}

/** Ngày Thanh Minh kế tiếp (>= from). */
export function nextThanhMinh(from = new Date()) {
  const base = stripTime(from)
  const t = thanhMinhOfYear(base.getFullYear())
  return t >= base ? t : thanhMinhOfYear(base.getFullYear() + 1)
}
