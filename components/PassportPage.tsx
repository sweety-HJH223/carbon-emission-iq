'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getUserLogs, ActivityLog } from '@/lib/db'

export default function PassportPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [showContent, setShowContent] = useState(false)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Trigger typewriter animation 
    setShowContent(true)

    async function fetchLogs() {
      if (user) {
        try {
          const fetchedLogs = await getUserLogs(user.uid, 50)
          setLogs(fetchedLogs)
        } catch (error) {
          console.error("Error fetching logs for passport:", error)
        } finally {
          setLoading(false)
        }
      } else if (!authLoading) {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ade80]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f0a] px-6 text-[#4ade80]">
        <h1 className="text-2xl font-bold mb-4">ACCESS DENIED</h1>
        <p className="opacity-70 mb-8">Please authenticate to view your Carbon Passport.</p>
        <Link href="/" className="border border-[#4ade80] px-6 py-2 rounded hover:bg-[#4ade8020]">
          RETURN TO HOME
        </Link>
      </div>
    )
  }


  const totalCO2 = profile?.totalCO2 || 0
  const carbonId = user.uid.substring(0, 8).toUpperCase()
  
  const getNation = (co2: number) => {
    if (co2 < 1000) return "Bangladesh"
    if (co2 < 2000) return "India avg"
    if (co2 < 4000) return "Turkey"
    if (co2 < 6000) return "China"
    return "USA"
  }

  const equivalentNation = getNation(totalCO2)
  const annualEstimate = (totalCO2 / 1000).toFixed(2)

  
  const categories: Record<string, number> = {}
  logs.forEach(log => {
    categories[log.category] = (categories[log.category] || 0) + log.co2_kg
  })
  const totalLogged = Object.values(categories).reduce((a, b) => a + b, 0) || 1
  const breakdown = Object.entries(categories).map(([name, value]) => ({
    category: name,
    percentage: Math.round((value / totalLogged) * 100)
  }))

  const allPossibleBadges = [
    { id: "FIRST LOG", icon: "■" },
    { id: "3-DAY STREAK", icon: "▲" },
    { id: "7-DAY STREAK", icon: "◆" },
    { id: "SAVED 10KG", icon: "●" },
    { id: "CARBON HERO", icon: "★" },
    { id: "CLIMATE LEADER", icon: "◈" },
  ]

  return (
    <main
      style={{
        backgroundColor: '#0a0f0a',
        color: '#4ade80',
        fontFamily: 'JetBrains Mono',
        backgroundImage: `repeating-linear-gradient(
          0deg,
          rgba(74, 222, 128, 0.03) 0px,
          rgba(74, 222, 128, 0.03) 1px,
          transparent 1px,
          transparent 2px
        )`,
      }}
      className="min-h-screen p-6 md:p-12 flex items-center justify-center"
    >
      <div className="max-w-2xl w-full">
        {/* Exit Link */}
        <div className="mb-8">
          <Link href="/" className="text-[#4ade80] hover:text-[#22c55e] transition-colors">
            {'> EXIT TERMINAL'}
          </Link>
        </div>

        {/* Terminal Card with Glow */}
        <div
          className="border-2 rounded p-8 md:p-12 glow"
          style={{
            borderColor: '#4ade80',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8 border-b border-[#4ade80] pb-6">
            <h1 className={showContent ? 'typewriter' : ''} style={{ fontFamily: 'JetBrains Mono' }}>
              CARBON PASSPORT
            </h1>
            <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem', marginTop: '0.5rem' }}>
              v2.4.1 ACTIVATED // USER_{carbonId}
            </p>
          </div>

          {/* Passport Info Grid */}
          <div className="space-y-6 mb-8">
            <div className="border-b border-[#4ade80] pb-4 opacity-90">
              <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem' }}>NAME:</p>
              <p className="text-lg">{profile?.displayName?.toUpperCase()}</p>
            </div>

            <div className="border-b border-[#4ade80] pb-4 opacity-80">
              <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem' }}>CARBON_ID:</p>
              <p className="text-lg">{carbonId}</p>
            </div>

            <div className="border-b border-[#4ade80] pb-4 opacity-70">
              <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem' }}>TOTAL_EMISSIONS:</p>
              <p className="text-lg">{totalCO2.toFixed(1)} kg CO₂ (~{annualEstimate} tonnes)</p>
            </div>

            <div className="border-b border-[#4ade80] pb-4 opacity-60">
              <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem' }}>EQUIVALENT_NATION:</p>
              <p className="text-lg">{equivalentNation.toUpperCase()}</p>
            </div>

            <div className="border-b border-[#4ade80] pb-4 opacity-50">
              <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem' }}>STREAK_RECORD:</p>
              <p className="text-lg">{profile?.streak} DAYS (BEST: {profile?.bestStreak})</p>
            </div>

            <div className="border-b border-[#4ade80] pb-4 opacity-40">
              <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem' }}>STATUS:</p>
              <p className="text-lg">ACTIVE - {totalCO2 < 500 ? 'ECO_WARRIOR' : 'REDUCING_FOOTPRINT'}</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="mb-8 border-t border-b border-[#4ade80] py-6">
            <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem', marginBottom: '1rem' }}>
              ACHIEVEMENTS_UNLOCKED:
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {allPossibleBadges.map((badge) => {
                const isUnlocked = profile?.badges?.includes(badge.id)
                return (
                  <div
                    key={badge.id}
                    title={badge.id}
                    className="aspect-square border rounded flex items-center justify-center text-sm text-center p-2 transition-all"
                    style={{
                      borderColor: isUnlocked ? '#4ade80' : '#4ade8033',
                      color: isUnlocked ? '#4ade80' : '#4ade8033',
                      backgroundColor: isUnlocked ? '#4ade8011' : 'transparent'
                    }}
                  >
                    {isUnlocked ? badge.icon : '□'}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Emissions by Category - Text Based */}
          <div className="mb-8 space-y-3">
            <p style={{ color: '#4ade80', opacity: 0.7, fontSize: '0.875rem' }}>EMISSIONS_BREAKDOWN:</p>
            {breakdown.length > 0 ? (
              breakdown.map((cat, index) => {
                const barLength = Math.ceil(cat.percentage / 5)
                return (
                  <div key={index} className="text-sm">
                    <p>
                      {cat.category}:
                      {' '.repeat(Math.max(1, 15 - cat.category.length))}
                      {'█'.repeat(barLength)}
                      {'░'.repeat(Math.max(0, 20 - barLength))} {cat.percentage}%
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm opacity-50 italic">NO DATA LOGGED FOR ANALYSIS</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-6 border-t border-[#4ade80]">
            <button className="w-full py-2 border border-[#4ade80] rounded hover:bg-[#4ade8020] transition-colors">
              {'> EXPORT PASSPORT'}
            </button>
            <button className="w-full py-2 border border-[#4ade80] rounded hover:bg-[#4ade8020] transition-colors">
              {'> GENERATE REPORT'}
            </button>
          </div>
        </div>

        {/* Scanline Effect */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(74, 222, 128, 0.02) 0px,
              rgba(74, 222, 128, 0.02) 1px,
              transparent 1px,
              transparent 2px
            )`,
            zIndex: 1,
          }}
        />
      </div>
    </main>
  )
}
