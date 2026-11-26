const VEHICLE_MODELS = [
  { key: 'pickup', label: 'وانت دوکابین' },
  { key: 'sedan', label: 'سواری' },
  { key: 'suv', label: 'شاسی‌بلند' },
  { key: 'nissan', label: 'کامیونت / نیسان' },
  { key: 'truck', label: 'کامیون باری' },
  { key: 'van', label: 'ون' },
  { key: 'bus', label: 'اتوبوس' },
  { key: 'moto', label: 'موتور شکاری' },
  { key: 'scooter', label: 'اسکوتر' },
  { key: 'bike', label: 'دوچرخه' },
  { key: 'excavator', label: 'بیل مکانیکی' },
  { key: 'boat', label: 'قایق' }
];

function getVehicleSvg(iconKey, color = '#0284c7', size = 36) {
  // پشتیبانی از عکس آپلودشده از گالری گوشی
  if (iconKey && String(iconKey).startsWith('data:image')) {
    return `<img src="${iconKey}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid ${color};display:block;">`;
  }
  const mapOld = { 'fa-truck-pickup': 'pickup', 'fa-truck': 'nissan', 'fa-car-side': 'sedan', 'fa-motorcycle': 'moto' };
  const k = mapOld[iconKey] || iconKey || 'pickup';
  const h = Math.round(size * 0.72);
  const sh = 'rgba(0,0,0,0.22)';
  const gl = '#cfe8ff';
  const wh = `<circle cx="17" cy="34" r="6" fill="#263238"/><circle cx="17" cy="34" r="2.6" fill="#cfd8dc"/><circle cx="49" cy="34" r="6" fill="#263238"/><circle cx="49" cy="34" r="2.6" fill="#cfd8dc"/>`;
  const svgs = {
    pickup: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="28" ry="3.5" fill="${sh}"/><path d="M5 20 L25 20 L31 10 L49 10 L55 19 L63 21 L63 32 L5 32 Z" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><path d="M32 12 L47 12 L52 19 L28 19 Z" fill="${gl}"/><rect x="7" y="16" width="18" height="4.5" rx="1" fill="#37474f"/><rect x="60" y="23" width="3.5" height="3.5" rx="1" fill="#fff176"/>${wh}</svg>`,
    sedan: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="28" ry="3.5" fill="${sh}"/><path d="M6 23 L14 20 L23 11 L45 11 L53 20 L63 22 L63 32 L6 32 Z" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><path d="M25 13 L43 13 L49 20 L19 20 Z" fill="${gl}"/><line x1="34" y1="13" x2="34" y2="20" stroke="#1e293b" stroke-width="1.2"/><rect x="60" y="24" width="3.5" height="3.5" rx="1" fill="#fff176"/>${wh}</svg>`,
    suv: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="28" ry="3.5" fill="${sh}"/><path d="M6 19 L11 9 L47 9 L55 19 L63 21 L63 32 L6 32 Z" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><rect x="13" y="12" width="14" height="7" rx="1.2" fill="${gl}"/><path d="M30 12 L45 12 L51 19 L30 19 Z" fill="${gl}"/><rect x="60" y="23" width="3.5" height="3.5" rx="1" fill="#fff176"/>${wh}</svg>`,
    nissan: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="28" ry="3.5" fill="${sh}"/><rect x="4" y="13" width="35" height="19" rx="2" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><line x1="14" y1="14" x2="14" y2="31" stroke="rgba(0,0,0,0.22)" stroke-width="1.5"/><line x1="26" y1="14" x2="26" y2="31" stroke="rgba(0,0,0,0.22)" stroke-width="1.5"/><path d="M40 10 L56 10 L63 20 L63 32 L40 32 Z" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><path d="M44 13 L54 13 L59 20 L44 20 Z" fill="${gl}"/>${wh}</svg>`,
    truck: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="29" ry="3.5" fill="${sh}"/><rect x="3" y="7" width="39" height="25" rx="2.5" fill="#eceff1" stroke="#37474f" stroke-width="1.3"/><path d="M43 11 L57 11 L64 21 L64 32 L43 32 Z" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><path d="M47 14 L56 14 L60 20 L47 20 Z" fill="${gl}"/>${wh}</svg>`,
    van: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="28" ry="3.5" fill="${sh}"/><path d="M6 12 C6 10 8 9 11 9 L51 9 L61 20 L63 32 L6 32 Z" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><rect x="11" y="13" width="12" height="7" rx="1" fill="${gl}"/><rect x="26" y="13" width="12" height="7" rx="1" fill="${gl}"/><path d="M41 13 L52 13 L57 20 L41 20 Z" fill="${gl}"/>${wh}</svg>`,
    bus: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="29" ry="3.5" fill="${sh}"/><rect x="4" y="8" width="60" height="24" rx="4" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><rect x="8" y="12" width="11" height="8" rx="1" fill="${gl}"/><rect x="22" y="12" width="11" height="8" rx="1" fill="${gl}"/><rect x="36" y="12" width="11" height="8" rx="1" fill="${gl}"/><rect x="50" y="12" width="11" height="9" rx="1" fill="${gl}"/>${wh}</svg>`,
    moto: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><ellipse cx="34" cy="39" rx="24" ry="3" fill="${sh}"/><circle cx="16" cy="32" r="8" fill="none" stroke="#263238" stroke-width="3.5"/><circle cx="52" cy="32" r="8" fill="none" stroke="#263238" stroke-width="3.5"/><path d="M16 32 L28 19 L44 19 L52 32 M27 19 L21 13 L14 14 M42 19 L47 11 L54 13" stroke="${color}" stroke-width="4.2" fill="none" stroke-linecap="round"/><ellipse cx="35" cy="19" rx="11" ry="5" fill="${color}"/></svg>`,
    scooter: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><circle cx="18" cy="33" r="6.5" fill="none" stroke="#263238" stroke-width="3.2"/><circle cx="50" cy="33" r="6.5" fill="none" stroke="#263238" stroke-width="3.2"/><path d="M14 25 L32 25 L43 13 L49 13 L45 29 L18 29 Z" fill="${color}" stroke="#1e293b" stroke-width="1.2"/></svg>`,
    bike: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><circle cx="17" cy="31" r="8.5" fill="none" stroke="#263238" stroke-width="2.6"/><circle cx="51" cy="31" r="8.5" fill="none" stroke="#263238" stroke-width="2.6"/><path d="M17 31 L30 18 L45 18 L51 31 M30 18 L34 31 L17 31 M45 18 L43 12 L49 12" stroke="${color}" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>`,
    excavator: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><rect x="8" y="30" width="32" height="8" rx="4" fill="#37474f"/><rect x="12" y="14" width="24" height="16" rx="2.5" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><rect x="22" y="17" width="10" height="8" fill="${gl}"/><path d="M36 22 L49 11 L59 23 L54 27" stroke="${color}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M52 26 L63 26 L58 34 Z" fill="#455a64"/></svg>`,
    boat: `<svg viewBox="0 0 68 44" width="${size}" height="${h}"><path d="M6 25 L62 25 L53 36 L14 36 Z" fill="${color}" stroke="#1e293b" stroke-width="1.3"/><path d="M22 25 L28 14 L46 14 L50 25 Z" fill="#fff" stroke="#1e293b" stroke-width="1.2"/><rect x="30" y="17" width="12" height="5" fill="${gl}"/></svg>`
  };
  return svgs[k] || svgs.pickup;
}

const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
function gregorianToJalali(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979; gy -= gy <= 1600 ? 621 : 1600;
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053); days %= 12053;
  jy += 4 * Math.floor(days / 1461); days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  let jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}
function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097); days %= 146097;
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * Math.floor(days / 1461); days %= 1461;
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const sal = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  for (; gm <= 12 && gd > sal[gm]; gm++) gd -= sal[gm];
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}
function formatShamsi(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const j = gregorianToJalali(y, m, d);
  return `${j.jd} ${PERSIAN_MONTHS[j.jm - 1]} ${j.jy}`;
}
