import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";

interface LoginParams {
  email: string;
  password: string;
}

export async function loginUser({ email, password }: LoginParams) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // 1️⃣ Sign in with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // 2️⃣ Fetch user profile from Firestore
  const userDocRef = doc(db, "regular_user", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    throw new Error("User profile not found");
  }

  return {
    uid: user.uid,
    email: user.email,
    ...userSnap.data(),
  };
}
