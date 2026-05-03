import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will trigger again with the anonymous user
          return;
        } catch (error) {
          console.error("Anonymous auth failed", error);
        }
      }

      setUser(user);
      if (user) {
        const path = `users/${user.uid}`;
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            const newProfile = {
              uid: user.uid,
              email: user.email || "anonymous@guest.com",
              displayName: user.displayName || `Guest ${user.uid.slice(0, 4)}`,
              role: "student",
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(docRef, newProfile);
              setProfile(newProfile);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, path);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
