"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, User, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { createOrUpdateUser, getUserProfile, UserProfile } from "./db";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect sign-in error:", error);
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Create or fetch user profile
        const existingProfile = await getUserProfile(firebaseUser.uid);
        if (!existingProfile) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            streak: 0,
            bestStreak: 0,
            totalCO2: 0,
            badges: ["FIRST LOG"],
          };
          await createOrUpdateUser(newProfile);
          setProfile(newProfile);
        } else {
          setProfile(existingProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      await signInWithRedirect(auth, provider)
    } catch (error: any) {
      console.error("Sign in error:", error.code, error.message)
      alert(`Sign in failed: ${error.message}`)
    }
  }

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const updated = await getUserProfile(user.uid);
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);