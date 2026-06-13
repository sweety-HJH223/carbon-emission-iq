"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User, GoogleAuthProvider } from "firebase/auth";
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
    console.log("AuthProvider: Initializing...");
    
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: Auth state changed", firebaseUser?.email);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
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
        } catch (error) {
          console.error("AuthProvider: Error fetching profile", error);
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
      console.log("AuthProvider: Starting sign in...");
      // Using Popup for better local development support
      const result = await signInWithPopup(auth, googleProvider);
      console.log("AuthProvider: Sign in successful", result.user.email);
    } catch (error: any) {
      console.error("AuthProvider: Sign in error", error);
      alert(`Sign in failed: ${error.message}`);
    }
  }

  const logout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      console.log("AuthProvider: Signed out");
    } catch (error) {
      console.error("AuthProvider: Logout error", error);
    }
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