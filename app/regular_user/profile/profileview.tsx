import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import ProfileComponent, {
  type ProfileViewModel,
} from "../../../components/profile/profilecomponent";
import { auth, db } from "../../../firebaseConfig";

interface RegularUserDoc {
  fullName?: string;
  address?: string;
  email?: string;
}

export default function ProfileViewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileViewModel | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (isMounted) {
          router.replace("/login/login");
          setLoading(false);
        }
        return;
      }

      try {
        const profileRef = doc(db, "regular_user", currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (!isMounted) {
          return;
        }

        if (!profileSnap.exists()) {
          setError("Profile not found.");
          setProfile({
            fullName: "User",
            address: "No address",
            email: currentUser.email || "No email",
          });
          return;
        }

        const data = profileSnap.data() as RegularUserDoc;
        setProfile({
          fullName: data.fullName || "User",
          address: data.address || "No address",
          email: data.email || currentUser.email || "No email",
        });
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        console.error("Failed to load profile:", fetchError);
        setError("Failed to load your profile.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  return (
    <ProfileComponent
      profile={profile}
      loading={loading}
      error={error}
      onBack={() => router.replace("/regular_user/home")}
    />
  );
}
