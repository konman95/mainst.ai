const KEY = "mainstai_auth";
export function setAuth(a: { uid: string; token: string }) {
  localStorage.setItem(KEY, JSON.stringify(a));
}
export function getAuth(): { uid: string; token: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.removeItem(KEY);
    return null;
  }
}
export function clearAuth() {
  localStorage.removeItem(KEY);
}
