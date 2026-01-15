import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebaseClient";
import { getAuth } from "./auth";

export function canUseRealtime() {
  const auth = getAuth();
  if (!auth || !auth.token) return false;
  if (auth.token.startsWith("dev-")) return false;
  return true;
}

export function subscribeCollection(
  pathParts: string[],
  orderField: string,
  onData: (rows: any[]) => void
) {
  const auth = getAuth();
  if (!auth || !canUseRealtime()) return null;
  const ref = collection(db, ...pathParts);
  const q = orderField ? query(ref, orderBy(orderField, "desc")) : ref;
  return onSnapshot(q, snap => {
    const rows = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    onData(rows);
  });
}

export function subscribeDoc(
  pathParts: string[],
  onData: (data: any | null) => void
) {
  const auth = getAuth();
  if (!auth || !canUseRealtime()) return null;
  const ref = doc(db, ...pathParts);
  return onSnapshot(ref, snap => {
    onData(snap.exists() ? snap.data() : null);
  });
}
