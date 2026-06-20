'use client'

import { useState, useEffect } from 'react'
import StatBox from './StatBox'
import { useAuth } from '@/lib/AuthContext'
import { getTodayChallenge, completeChallenge, getWeeklyChallenges, DailyChallenge } from '@/lib/db'

export default function ChallengesPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [todayChallenge, setTodayChallenge] = useState<DailyChallenge | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<DailyChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Weekly goal 
  const weeklyGoal = 5.0
  const savedThisWeek = weeklyPlan
    .filter(c => c.completed)
    .reduce((acc, curr) => acc + (curr.co2Saving || 0), 0)
  const progressPercent = Math.min(Math.round((savedThisWeek / weeklyGoal) * 100), 100)

  useEffect(() => {
    async function fetchChallengeData() {
      if (user) {
        try {
          let today = await getTodayChallenge(user.uid)
          
          if (!today) {
            const res = await fetch('/api/challenge', {
              method: 'POST',
              body: JSON.stringify({ userId: user.uid }),
            })
            if (res.ok) {
              today = await res.json()
            }
          }
          setTodayChallenge(today)

          const weekly = await getWeeklyChallenges(user.uid)
          setWeeklyPlan(weekly)
        } catch (error) {
          console.error("Error fetching challenges:", error)
        } finally {
          setLoading(false)
        }
      } else if (!authLoading) {
        setLoading(false)
      }
    }
    fetchChallengeData()
  }, [user, authLoading])

  const handleComplete = async () => {
    if (!user || !todayChallenge || todayChallenge.completed) return
    
    setActionLoading(true)
    try {
      await completeChallenge(user.uid)
      setTodayChallenge({ ...todayChallenge, completed: true })
      setWeeklyPlan(prev => prev.map(c => c.date === todayChallenge.date ? { ...c, completed: true } : c))
      await refreshProfile()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    } catch (error) {
      console.error("Error completing challenge:", error)
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div role="status" aria-label="Loading" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3d2b]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <h1 className="text-2xl font-bold text-[#1a3d2b] mb-4">Sign in to take challenges</h1>
        <p className="text-[#666] mb-8">Personalized daily missions to reduce your carbon footprint.</p>
        <button 
          onClick={() => {
            const navSignIn = document.querySelector('nav button') as HTMLButtonElement;
            if (navSignIn) navSignIn.click();
          }}
          className="bg-[#1a3d2b] text-white px-8 py-3 rounded"
        >
          Sign In Now
        </button>
      </div>
    )
  }

  const difficultyColors = {
    Easy: 'text-green-600 bg-green-50 border-green-200',
    Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Hard: 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Weekly Progress Bar */}
        <div className="mb-12 bg-[#f5f0e8] p-6 rounded-xl border border-[#e0e0e0]">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs font-bold text-[#1a3d2b] uppercase tracking-widest mb-1">Weekly Impact Goal</p>
              <h3 className="text-xl font-bold text-[#1a3d2b]">{savedThisWeek.toFixed(1)} / {weeklyGoal} kg saved</h3>
            </div>
            <span className="text-sm font-bold text-[#1a3d2b]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white rounded-full h-4 border border-[#e0e0e0] overflow-hidden">
            <div 
              className="bg-[#52b788] h-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-[#666] mt-3 italic">
            {progressPercent >= 100 ? "🎉 Goal reached! You're a carbon hero." : `Save ${ (weeklyGoal - savedThisWeek).toFixed(1) }kg more to hit your weekly target.`}
          </p>
        </div>

        {/* Today's Challenge Hero */}
        <div className="relative overflow-hidden bg-[#1a3d2b] text-white rounded-2xl p-8 md:p-12 mb-12 shadow-xl">
          <div className="absolute top-0 right-0 p-4">
             <span className={`px-3 py-1 rounded-full text-xs font-bold border ${difficultyColors[todayChallenge?.difficulty || 'Easy']}`}>
                {todayChallenge?.difficulty || 'Easy'}
             </span>
          </div>

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <p className="text-sm font-bold text-[#52b788] mb-4 uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="animate-pulse">🔥</span> Current Mission
            </p>
            <h1
              style={{ fontFamily: 'DM Serif Display' }}
              className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
            >
              {todayChallenge?.challenge || "Generating your mission..."}
            </h1>
            
            <div className="flex justify-center gap-4 flex-wrap mb-8">
              <div className="bg-[#ffffff20] backdrop-blur-sm border border-[#ffffff30] px-4 py-2 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-[#52b788] mb-1">Category</p>
                <p className="text-sm font-bold">{todayChallenge?.category}</p>
              </div>
              <div className="bg-[#ffffff20] backdrop-blur-sm border border-[#ffffff30] px-4 py-2 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-[#52b788] mb-1">Potential Saving</p>
                <p className="text-sm font-bold">{todayChallenge?.co2Saving} kg CO₂</p>
              </div>
            </div>
            
            {todayChallenge?.completed ? (
              <div className="bg-[#52b788] text-white px-10 py-4 rounded-full inline-flex items-center gap-2 font-bold shadow-lg transform scale-110 transition-transform">
                <span>✓ Mission Accomplished</span>
              </div>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={actionLoading}
                className="group bg-white text-[#1a3d2b] px-12 py-4 rounded-full font-bold hover:bg-[#f5f0e8] transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
              >
                {actionLoading ? "Syncing..." : "I Did This!"}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            )}
          </div>

          {/* Decorative background circle */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#52b78820] rounded-full blur-3xl"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#52b78820] rounded-full blur-3xl"></div>
        </div>

        {/* Success Message Overlay */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white border-2 border-[#52b788] rounded-2xl p-8 shadow-2xl transform animate-bounce-in text-center">
              <p className="text-5xl mb-4">🌟</p>
              <h2 className="text-2xl font-bold text-[#1a3d2b] mb-2">Awesome Work!</h2>
              <p className="text-[#666]">You just saved {todayChallenge?.co2Saving}kg of CO₂.</p>
              <p className="text-[#52b788] font-bold mt-2">Streak Extended! 🔥</p>
            </div>
          </div>
        )}

        {/* Streak Tracker */}
        <div className="mb-12">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-2xl font-bold text-[#1a3d2b] mb-6"
          >
            Your Eco Streak
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatBox label="Current Streak" value={profile?.streak || 0} unit="days" subtitle="Log daily to keep it alive!" />
            <StatBox label="Best Streak" value={profile?.bestStreak || 0} unit="days" subtitle="Your all-time record" />
            <StatBox label="This Week" value={weeklyPlan.filter(c => c.completed).length} unit="completed" />
          </div>

          {/* 7-Day Visualizer */}
          <div className="bg-[#f5f0e8] p-8 rounded-xl flex justify-center gap-4 flex-wrap">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const streak = profile?.streak || 0;
              const isActive = index < (streak % 7) || (streak > 0 && index === 6 && streak % 7 === 0);
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                   <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                      isActive
                        ? 'bg-[#1a3d2b] text-[#52b788] transform scale-110 shadow-lg border-2 border-[#52b788]'
                        : 'bg-white text-[#ccc] border border-[#e0e0e0]'
                    }`}
                  >
                    {isActive ? '🔥' : day.charAt(0)}
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-[#1a3d2b]' : 'text-[#ccc]'}`}>{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="mb-12">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-2xl font-bold text-[#1a3d2b] mb-6"
          >
            Unlocked Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {profile?.badges?.map((badge, idx) => (
              <div key={idx} className="bg-white border border-[#e0e0e0] p-4 rounded-xl text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#f5f0e8] rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
                  {badge.includes('STREAK') ? '🔥' : badge.includes('LOG') ? '🌱' : '🏆'}
                </div>
                <p className="text-[10px] font-bold text-[#1a3d2b] uppercase tracking-tighter">{badge}</p>
              </div>
            )) || <p className="text-[#666] text-sm italic">Complete challenges to earn badges!</p>}
          </div>
        </div>

        {/* Weekly History */}
        <div className="mb-12">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-2xl font-bold text-[#1a3d2b] mb-6"
          >
            Mission History
          </h2>
          <div className="bg-white border border-[#e0e0e0] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5f0e8] text-left">
                    <th className="px-6 py-4 text-xs font-bold text-[#1a3d2b] uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#1a3d2b] uppercase tracking-widest">Mission</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#1a3d2b] uppercase tracking-widest">Level</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#1a3d2b] uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyPlan.length > 0 ? (
                    weeklyPlan.map((plan, index) => (
                      <tr key={index} className="border-t border-[#e0e0e0] hover:bg-[#fcfaf7] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[#1a3d2b]">{plan.date}</td>
                        <td className="px-6 py-4 text-sm text-[#666]">{plan.challenge}</td>
                        <td className="px-6 py-4 text-xs font-bold">
                           <span className={`px-2 py-0.5 rounded ${difficultyColors[plan.difficulty || 'Easy']}`}>
                             {plan.difficulty || 'Easy'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {plan.completed ? "COMPLETED" : "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[#666] italic">
                        Your eco-journey begins today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
