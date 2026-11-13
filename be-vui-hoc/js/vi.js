// Đọc số thành chữ (0 – 100) bằng tiếng Việt hoặc tiếng Anh
import { lang } from './i18n.js';

const D = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

export function numWordVi(n) {
  n = Math.floor(n);
  if (n < 0) return 'âm ' + numWordVi(-n);
  if (n < 10) return D[n];
  if (n < 20) {
    const u = n % 10;
    return 'mười' + (u === 0 ? '' : ' ' + (u === 5 ? 'lăm' : D[u]));
  }
  if (n < 100) {
    const t = Math.floor(n / 10), u = n % 10;
    let s = D[t] + ' mươi';
    if (u === 1) s += ' mốt';
    else if (u === 4) s += ' tư';
    else if (u === 5) s += ' lăm';
    else if (u > 0) s += ' ' + D[u];
    return s;
  }
  if (n === 100) return 'một trăm';
  return String(n);
}

const E1 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const E10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numWordEn(n) {
  n = Math.floor(n);
  if (n < 0) return 'minus ' + numWordEn(-n);
  if (n < 20) return E1[n];
  if (n < 100) {
    const t = Math.floor(n / 10), u = n % 10;
    return E10[t] + (u ? '-' + E1[u] : '');
  }
  if (n === 100) return 'one hundred';
  return String(n);
}

/** Đọc số theo ngôn ngữ đang chọn. */
export const numWord = (n) => (lang() === 'en' ? numWordEn(n) : numWordVi(n));

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
