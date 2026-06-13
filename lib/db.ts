import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  // ─── TYPES ────────────────────────────────────────────────
  export interface ActivityLog {
    id?: string;
    userId: string;
    activity: string;
    category: string;
    co2_kg: number;
    calculation: string;
    tip: string;
    comparison: string;
    createdAt?: any;
  }
  
  export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    baselineFootprint?: number;
    streak: number;
    bestStreak: number;
    totalCO2: number;
    lastLogDate?: string;
    badges: string[];
    createdAt?: any;
  }
  
  export interface DailyChallenge {
    userId: string;
    date: string; // YYYY-MM-DD
    challenge: string;
    category: string;
    co2Saving: number;
    difficulty: "Easy" | "Medium" | "Hard";
    completed: boolean;
  }
  
  // ─── USER PROFILE ─────────────────────────────────────────
  export async function createOrUpdateUser(profile: UserProfile) {
    const ref = doc(db, "users", profile.uid);
    await setDoc(ref, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
  }
  
  export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }
  
  export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  }
  
  // ─── ACTIVITY LOGS ────────────────────────────────────────
  export async function saveActivityLog(log: ActivityLog): Promise<string> {
    const ref = collection(db, "activityLogs");
    const docRef = await addDoc(ref, {
      ...log,
      createdAt: serverTimestamp(),
    });
  
    // Update user's total CO2
    await updateUserTotalCO2(log.userId, log.co2_kg);
    // Update streak
    await updateStreak(log.userId);
  
    return docRef.id;
  }
  
  export async function getUserLogs(uid: string, limitCount = 20): Promise<ActivityLog[]> {
    const ref = collection(db, "activityLogs");
    const q = query(
      ref,
      where("userId", "==", uid),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
    // Sort in-memory to avoid composite index requirement
    return logs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
  
  export async function getWeeklyLogs(uid: string): Promise<ActivityLog[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
    const ref = collection(db, "activityLogs");
    const q = query(
      ref,
      where("userId", "==", uid),
      where("createdAt", ">=", sevenDaysAgo)
    );
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
    // Sort in-memory to avoid composite index requirement
    return logs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
  
  // ─── STREAK MANAGEMENT ────────────────────────────────────
  async function updateStreak(uid: string) {
    const profile = await getUserProfile(uid);
    if (!profile) return;
  
    const today = new Date().toISOString().split("T")[0];
    const lastLog = profile.lastLogDate;
  
    let newStreak = profile.streak || 0;
  
    if (lastLog === today) {
      // Already logged today, no streak change
      return;
    }
  
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
  
    if (lastLog === yesterdayStr) {
      // Consecutive day
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  
    const newBest = Math.max(newStreak, profile.bestStreak || 0);
  
    // Check for new badges
    const badges = [...(profile.badges || [])];
    if (newStreak >= 3 && !badges.includes("3-DAY STREAK")) badges.push("3-DAY STREAK");
    if (newStreak >= 7 && !badges.includes("7-DAY STREAK")) badges.push("7-DAY STREAK");
    if (newStreak >= 14 && !badges.includes("14-DAY STREAK")) badges.push("14-DAY STREAK");
    if (newStreak >= 30 && !badges.includes("CARBON HERO")) badges.push("CARBON HERO");
    if (newStreak >= 100 && !badges.includes("CENTURION")) badges.push("CENTURION");
  
    await updateUserProfile(uid, {
      streak: newStreak,
      bestStreak: newBest,
      lastLogDate: today,
      badges,
    });
  }
  
  async function updateUserTotalCO2(uid: string, co2: number) {
    const profile = await getUserProfile(uid);
    if (!profile) return;
  
    const newTotal = (profile.totalCO2 || 0) + co2;
    const badges = [...(profile.badges || [])];
  
    if (newTotal >= 1 && !badges.includes("FIRST LOG")) badges.push("FIRST LOG");
    if (newTotal >= 10 && !badges.includes("SAVED 10KG")) badges.push("SAVED 10KG");
    if (newTotal >= 50 && !badges.includes("SAVED 50KG")) badges.push("SAVED 50KG");
    if (newTotal >= 100 && !badges.includes("ECO WARRIOR")) badges.push("ECO WARRIOR");
    if (newTotal >= 500 && !badges.includes("PLANET PROTECTOR")) badges.push("PLANET PROTECTOR");
    if (newTotal >= 1000 && !badges.includes("EARTH GUARDIAN")) badges.push("EARTH GUARDIAN");
  
    await updateUserProfile(uid, { totalCO2: newTotal, badges });
  }
  
  // ─── DAILY CHALLENGE ──────────────────────────────────────
  export async function saveDailyChallenge(challenge: DailyChallenge) {
    const id = `${challenge.userId}_${challenge.date}`;
    const ref = doc(db, "dailyChallenges", id);
    await setDoc(ref, challenge, { merge: true });
  }
  
  export async function getTodayChallenge(uid: string): Promise<DailyChallenge | null> {
    const today = new Date().toISOString().split("T")[0];
    const id = `${uid}_${today}`;
    const ref = doc(db, "dailyChallenges", id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as DailyChallenge) : null;
  }
  
  export async function completeChallenge(uid: string) {
    const today = new Date().toISOString().split("T")[0];
    const id = `${uid}_${today}`;
    const ref = doc(db, "dailyChallenges", id);
    await updateDoc(ref, { completed: true });
  }
  
  export async function getWeeklyChallenges(uid: string): Promise<DailyChallenge[]> {
    const ref = collection(db, "dailyChallenges");
    const q = query(ref, where("userId", "==", uid), limit(7));
    const snap = await getDocs(q);
    const challenges = snap.docs.map((d) => d.data() as DailyChallenge);
    // Sort in-memory to avoid composite index requirement
    return challenges.sort((a, b) => b.date.localeCompare(a.date));
  }