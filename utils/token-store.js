const store = new Map();

export function addRefreshToken(userId, token) {
  if (!store.has(userId)) store.set(userId, new Set());
  store.get(userId).add(token);
}
export function hasRefreshToken(userId, token) {
  return store.has(userId) && store.get(userId).has(token);
}
export function removeRefreshToken(userId, token) {
  if (store.has(userId)) store.get(userId).delete(token);
}
