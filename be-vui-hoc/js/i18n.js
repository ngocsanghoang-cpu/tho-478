// Ngôn ngữ của ứng dụng: Tiếng Việt (vi) hoặc English (en)
import { store } from './store.js';

export const lang = () => (store.data.lang === 'en' ? 'en' : 'vi');
export const isEn = () => lang() === 'en';

/** Chọn chuỗi theo ngôn ngữ hiện tại: L('Xin chào', 'Hello') */
export const L = (vi, en) => (lang() === 'en' ? en : vi);

/** Đổi ngôn ngữ rồi tải lại trang để mọi màn hình dùng ngôn ngữ mới. */
export function setLang(l) {
  if (l !== 'vi' && l !== 'en') return;
  if (l === lang()) return;
  store.set({ lang: l });
  location.reload();
}
