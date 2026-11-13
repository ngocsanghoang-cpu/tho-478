// Đọc số bằng tiếng Việt (0 – 100)
const D = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

export function numWord(n) {
  n = Math.floor(n);
  if (n < 0) return 'âm ' + numWord(-n);
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

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
