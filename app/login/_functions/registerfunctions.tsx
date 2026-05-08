import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";

interface RegisterParams {
  fullName: string;
  address: string;
  email: string;
  password: string;
  confirmPassword: string;
  waterMeter: number;
}

const CITY_SUFFIX = ", Toledo City";

const normalizeAddress = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.toLowerCase().endsWith(CITY_SUFFIX.toLowerCase())) {
    return trimmed;
  }

  return `${trimmed}${CITY_SUFFIX}`;
};

export async function registerUser({
  fullName,
  address,
  email,
  password,
  confirmPassword,
  waterMeter,
}: RegisterParams) {
  const formattedAddress = normalizeAddress(address);

  if (!fullName || !formattedAddress || !email || !password) {
    throw new Error("All fields are required");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  if (waterMeter < 0) {
    throw new Error("Water meter must be non-negative");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const user = userCredential.user;

  await setDoc(doc(db, "regular_user", user.uid), {
    uid: user.uid,
    fullName,
    address: formattedAddress,
    email,
    role: "regular_user",
    status: "Inactive",
    presenceStatus: "Inactive",
    presenceSource: "register",
    presenceUpdatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    waterMeter,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}
