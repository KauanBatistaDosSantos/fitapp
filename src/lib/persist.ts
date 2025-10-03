export const load = <T,>(k: string, fb: T): T => {
  try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return fb; }
};
export const save = <T,>(k: string, v: T) => localStorage.setItem(k, JSON.stringify(v));
export const remove = (k: string) => localStorage.removeItem(k);
export const uid = () => crypto.randomUUID();
