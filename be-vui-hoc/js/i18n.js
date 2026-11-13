// Ngôn ngữ của ứng dụng: Tiếng Việt (vi) hoặc English (en)
import { store } from './store.js';
import { configureSpeech } from './speech.js';

export const lang = () => (store.data.lang === 'en' ? 'en' : 'vi');
export const isEn = () => lang() === 'en';

/** Chọn chuỗi theo ngôn ngữ hiện tại: L('Xin chào', 'Hello') */
export const L = (vi, en) => (lang() === 'en' ? en : vi);

/**
 * Dữ liệu có chữ theo ngôn ngữ: dựng một lần cho mỗi ngôn ngữ rồi nhớ lại.
 *   const DATA = byLang(() => ({ title: L('Xin chào', 'Hello') }));   DATA().title
 */
export function byLang(build) {
  const cache = {};
  return () => cache[lang()] || (cache[lang()] = build());
}

/** Đổi ngôn ngữ ngay (không cần tải lại trang): cả chữ trên màn hình lẫn giọng đọc. */
export function setLang(l) {
  if (l !== 'vi' && l !== 'en') return;
  if (l !== lang()) store.set({ lang: l });
  document.documentElement.lang = l;
  configureSpeech({ lang: l, voiceURI: (store.data.voices && store.data.voices[l]) || '' });
}
