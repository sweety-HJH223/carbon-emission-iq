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

  useEffect(() => {
    async function fetchChallengeData() {
      if (user) {
        try {
          // 1. Get today's challenge
          let today = await getTodayChallenge(user.uid)
          
          if (!today) {
            // Generate if missing
            const res = await fetch('/api/challenge', {
              method: 'POST',
              body: JSON.stringify({ userId: user.uid }),
            })
            if (res.ok) {
              today = await res.json()
            }
          }
          setTodayChallenge(today)

          // 2. Get weekly history
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
      // Optionally update weekly plan
      setWeeklyPlan(prev => prev.map(c => c.date === todayChallenge.date ? { ...c, completed: true } : c))
      await refreshProfile()
    } catch (error) {
      console.error("Error completing challenge:", error)
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3d2b]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <h1 className="text-2xl font-bold text-[#1a3d2b] mb-4">Sign in to take challenges</h1>
        <p className="text-[#666] mb-8">Personalized daily missions to reduce your carbon footprint.</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Today's Challenge Hero */}
        <div className="bg-[#f5f0e8] rounded p-8 md:p-12 mb-12 text-center">
          <p className="text-sm font-bold text-[#52b788] mb-2 uppercase tracking-widest">Today&apos;s Mission</p>
          <h1
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-3xl md:text-4xl font-bold text-[#1a3d2b] mb-4"
          >
            {todayChallenge?.challenge || "Generating your mission..."}
          </h1>
          <p className="text-[#666] mb-6">
            Category: <span className="font-bold">{todayChallenge?.category}</span>
          </p>
          <div className="flex justify-center gap-4 flex-wrap mb-6">
            <span className="px-4 py-1 text-sm bg-white border border-[#52b788] text-[#52b788] rounded">
              Potential Saving: {todayChallenge?.co2Saving} kg CO₂
            </span>
          </div>
          
          {todayChallenge?.completed ? (
            <div className="bg-[#52b788] text-white px-8 py-3 rounded inline-flex items-center gap-2">
              <span>✓ Completed</span>
            </div>
          ) : (
            <button 
              onClick={handleComplete}
              disabled={actionLoading}
              className="bg-[#1a3d2b] text-white px-8 py-3 rounded hover:bg-[#2d6a4f] transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "I Did This"}
            </button>
          )}
        </div>

        {/* Streak Tracker */}
        <div className="mb-12">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-2xl font-bold text-[#1a3d2b] mb-6"
          >
            Your Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatBox label="Current Streak" value={profile?.streak || 0} unit="days" />
            <StatBox label="Best Streak" value={profile?.bestStreak || 0} unit="days" />
            <StatBox label="Total Completed" value={weeklyPlan.filter(c => c.completed).length} unit="this week" />
          </div>

          {/* 7-Day Visualizer */}
          <div className="flex justify-center gap-3 flex-wrap">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              // This is a simple visualizer, doesn't map perfectly to real days yet
              const isActive = index < (profile?.streak || 0) % 7 || (profile?.streak || 0) >= 7;
              return (
                <div
                  key={index}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#1a3d2b] text-white'
                      : 'bg-[#e0e0e0] text-[#999]'
                  }`}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly Plan / History */}
        <div className="mb-12">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-2xl font-bold text-[#1a3d2b] mb-6"
          >
            Recent Missions
          </h2>
          <div className="border border-[#e0e0e0] rounded overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f0e8] border-b border-[#e0e0e0]">
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#1a3d2b]">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#1a3d2b]">Challenge</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-[#1a3d2b]">Status</th>
                </tr>
              </thead>
              <tbody>
                {weeklyPlan.length > 0 ? (
                  weeklyPlan.map((plan, index) => (
                    <tr key={index} className="border-b border-[#e0e0e0] last:border-b-0 hover:bg-[#f9f9f9]">
                      <td className="px-6 py-4 text-sm font-medium text-[#1a3d2b]">{plan.date}</td>
                      <td className="px-6 py-4 text-sm text-[#666]">{plan.challenge}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={plan.completed ? "text-[#52b788] font-bold" : "text-[#999]"}>
                          {plan.completed ? "✓ Done" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#666]">
                      No previous missions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="mb-12">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-2xl font-bold text-[#1a3d2b] mb-6"
          >
            Sustainability Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#e0e0e0] rounded p-6">
              <h3 className="font-bold text-[#1a3d2b] mb-2 text-sm">Energy Win</h3>
              <p className="text-[#666] text-sm">Switching to LED bulbs in your main rooms can save up to 80% on lighting energy.</p>
            </div>
            <div className="border border-[#e0e0e0] rounded p-6">
              <h3 className="font-bold text-[#1a3d2b] mb-2 text-sm">Travel Tip</h3>
              <p className="text-[#666] text-sm">Proper tire pressure can improve fuel efficiency by up to 3% for your car.</p>
            </div>
            <div className="border border-[#e0e0e0] rounded p-6">
              <h3 className="font-bold text-[#1a3d2b] mb-2 text-sm">Food Fact</h3>
              <p className="text-[#666] text-sm">One meat-free day a week can reduce your food carbon footprint by 15%.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
