import firebaseApp from "./firebase";
import { getFirestore } from "firebase/firestore";

export const db = getFirestore(firebaseApp as any);
