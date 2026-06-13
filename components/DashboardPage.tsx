'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatBox from './StatBox'
import { useAuth } from '@/lib/AuthContext'
import { getWeeklyLogs, getUserLogs, ActivityLog } from '@/lib/db'
import FutureSelf from '@/components/FutureSelf'

const COLORS = ['#1a3d2b', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc']

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  // Dynamic Background Logic
  const totalCO2 = profile?.totalCO2 || 0
  const isEden = totalCO2 < 100
  const isDoom = totalCO2 >= 1000
  const themeClass = isEden ? 'bg-[#f0faf4]' : isDoom ? 'bg-[#1a1a1a] text-white' : 'bg-white'

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          const [weekly, recent] = await Promise.all([
            getWeeklyLogs(user.uid),
            getUserLogs(user.uid, 5)
          ])
          setLogs(weekly)
          setRecentLogs(recent)
        } catch (error) {
          console.error("Error fetching dashboard data:", error)
        } finally {
          setLoading(false)
        }
      } else if (!authLoading) {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, authLoading])

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
        <h1 className="text-2xl font-bold text-[#1a3d2b] mb-4">Sign in to see your data</h1>
        <p className="text-[#666] mb-8">Track your carbon footprint and compete with others.</p>
      </div>
    )
  }

  // Calculate Stats
  const weeklyTotal = logs.reduce((acc, log) => acc + log.co2_kg, 0)
  // Simple monthly estimate or filter logs if we had more
  const monthlyTotal = profile?.totalCO2 || 0 // Or calculate from more logs

  // Prepare Weekly Chart Data (Last 7 days)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayName = days[d.getDay()]
    const dayTotal = logs
      .filter(log => {
        const logDate = log.createdAt?.toDate() || new Date()
        return logDate.toDateString() === d.toDateString()
      })
      .reduce((acc, log) => acc + log.co2_kg, 0)
    return { day: dayName, value: Number(dayTotal.toFixed(1)) }
  })

  // Prepare Category Data
  const categories: Record<string, number> = {}
  logs.forEach(log => {
    categories[log.category] = (categories[log.category] || 0) + log.co2_kg
  })
  const categoryData = Object.entries(categories).map(([name, value], index) => ({
    name,
    value: Number(value.toFixed(1)),
    color: COLORS[index % COLORS.length]
  }))

  return (
    <main className={`min-h-screen px-6 py-12 transition-colors duration-1000 ${themeClass}`}>
      <div className="max-w-6xl mx-auto">
        {/* Greeting */}
        <h1
          style={{ fontFamily: 'DM Serif Display' }}
          className={`text-3xl md:text-4xl font-bold mb-12 ${isDoom ? 'text-[#e76f51]' : 'text-[#1a3d2b]'}`}
        >
          {isDoom ? "Wake up," : "Good morning,"} {profile?.displayName?.split(' ')[0]}.
        </h1>

        {/* Stat Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatBox label="This Week" value={Number(weeklyTotal.toFixed(1))} unit="kg CO₂" subtitle="Total from last 7 days" isDoom={isDoom} />
          <StatBox label="Total Lifetime" value={Number((profile?.totalCO2 || 0).toFixed(1))} unit="kg CO₂" subtitle="All-time carbon footprint" isDoom={isDoom} />
          <StatBox label="Current Streak" value={profile?.streak || 0} unit="days" subtitle="Great job! Keep it up" isDoom={isDoom} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Weekly Line Chart */}
          <div className={`border rounded p-6 ${isDoom ? 'bg-[#262626] border-[#333]' : 'border-[#e0e0e0] bg-white'}`}>
            <h2 className={`text-lg font-bold mb-6 ${isDoom ? 'text-[#e76f51]' : 'text-[#1a3d2b]'}`}>Weekly Emissions</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDoom ? "#333" : "#e0e0e0"} />
                <XAxis dataKey="day" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: isDoom ? '#1a1a1a' : '#f5f0e8', border: 'none' }} />
                <Line type="monotone" dataKey="value" stroke={isDoom ? "#e76f51" : "#1a3d2b"} strokeWidth={2} dot={{ fill: isDoom ? "#e76f51" : "#1a3d2b", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart */}
          <div className={`border rounded p-6 ${isDoom ? 'bg-[#262626] border-[#333]' : 'border-[#e0e0e0] bg-white'}`}>
            <h2 className={`text-lg font-bold mb-6 ${isDoom ? 'text-[#e76f51]' : 'text-[#1a3d2b]'}`}>By Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 1, color: isDoom ? '#333' : '#e0e0e0' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDoom ? '#1a1a1a' : '#f5f0e8', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Legend */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {categoryData.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
              <span className={`text-sm ${isDoom ? 'text-[#999]' : 'text-[#666]'}`}>
                {cat.name} <span className={`font-bold ${isDoom ? 'text-white' : ''}`}>{cat.value}kg</span>
              </span>
            </div>
          ))}
        </div>

        <FutureSelf currentAnnualKg={4200} streak={7} />

        {/* Today's Challenge */}
        <div className={`rounded p-8 mb-12 ${isDoom ? 'bg-[#262626] border border-[#333]' : 'bg-[#f5f0e8]'}`}>
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className={`text-2xl font-bold mb-2 ${isDoom ? 'text-[#e76f51]' : 'text-[#1a3d2b]'}`}
          >
            Daily Mission
          </h2>
          <p className={`${isDoom ? 'text-[#999]' : 'text-[#666]'} mb-4`}>
            Head over to the Challenges page to see your daily AI-generated mission and boost your streak!
          </p>
          <button 
            onClick={() => window.location.href = '/challenges'}
            className={`px-6 py-2 rounded transition-colors ${isDoom ? 'bg-[#e76f51] text-white hover:bg-[#cf5d41]' : 'bg-[#1a3d2b] text-white hover:bg-[#2d6a4f]'}`}
          >
            Go to Challenges
          </button>
        </div>

        {/* Recent Activity */}
        <div className={`border rounded p-6 ${isDoom ? 'bg-[#262626] border-[#333]' : 'border-[#e0e0e0] bg-white'}`}>
          <h2 className={`text-lg font-bold mb-6 ${isDoom ? 'text-[#e76f51]' : 'text-[#1a3d2b]'}`}>Recent Activity</h2>
          <div className="space-y-4">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className={`flex justify-between items-center border-b pb-4 last:border-b-0 ${isDoom ? 'border-[#333]' : 'border-[#e0e0e0]'}`}>
                  <div>
                    <p className={`font-medium ${isDoom ? 'text-white' : 'text-[#1a3d2b]'}`}>{log.activity}</p>
                    <p className={`text-sm ${isDoom ? 'text-[#666]' : 'text-[#999]'}`}>
                      {log.createdAt?.toDate().toLocaleDateString()} {log.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className={`font-bold ${isDoom ? 'text-[#e76f51]' : 'text-[#1a3d2b]'}`}>
                    {log.co2_kg} kg CO₂
                  </p>
                </div>
              ))
            ) : (
              <p className={`text-center py-4 ${isDoom ? 'text-[#666]' : 'text-[#666]'}`}>No activities logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
