import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";

interface RegisterParams {
  fullName: string;
  address: string;
  email: string;
  password: string;
  confirmPassword: string;
  waterMeter: number; // ✅ new field
}

export async function registerUser({
  fullName,
  address,
  email,
  password,
  confirmPassword,
  waterMeter,
}: RegisterParams) {
  if (!fullName || !address || !email || !password) {
    throw new Error("All fields are required");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  if (waterMeter < 0) {
    throw new Error("Water meter must be non-negative");
  }

  // 1️⃣ Create Auth account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // 2️⃣ Save profile to Firestore (with waterMeter)
  await setDoc(doc(db, "regular_user", user.uid), {
    uid: user.uid,
    fullName,
    address,
    email,
    role: "regular_user",
    waterMeter,          // ✅ store input value
    createdAt: serverTimestamp(),
  });

  return user;
}
