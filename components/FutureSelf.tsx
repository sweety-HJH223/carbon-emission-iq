'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface FutureSelfProps {
  currentAnnualKg?: number // user's current yearly CO2 in kg
  streak?: number
}

const COST_PER_TONNE = 4250 // ₹ per tonne CO2

export default function FutureSelf({
  currentAnnualKg = 4200,
  streak = 0,
}: FutureSelfProps) {
  const currentYear = new Date().getFullYear()

  // Reduction rate from 1% daily challenge
  // ~1% per week compounded realistically
  const CHALLENGE_REDUCTION = 0.08 // 8% per year if doing challenges
  const FUEL_SAVINGS_PER_KG = 85 // ₹ saved per kg CO2 avoided (fuel cost)

  const data = useMemo(() => {
    const years = [0, 1, 2, 3, 4, 5, 8, 10]
    return years.map((y) => {
      const year = currentYear + y
      // Path A: business as usual, slight 1% annual increase
      const pathA = currentAnnualKg * Math.pow(1.01, y) * y || 0
      // Path B: following challenges, 8% annual reduction
      const pathB = currentAnnualKg * (1 - CHALLENGE_REDUCTION) ** y * y * 0.7 || 0

      return {
        year: year.toString(),
        'Do Nothing': parseFloat((pathA / 1000).toFixed(2)),
        'With CarbonIQ': parseFloat((pathB / 1000).toFixed(2)),
      }
    })
  }, [currentAnnualKg, currentYear])

  // Calculate 10-year projections
  const tenYearDoNothing = currentAnnualKg * 10 * 1.01 ** 10
  const tenYearWithApp = currentAnnualKg * (1 - CHALLENGE_REDUCTION) ** 10 * 10 * 0.7
  const co2Saved = tenYearDoNothing - tenYearWithApp
  const moneySaved = co2Saved * (FUEL_SAVINGS_PER_KG / 1000)
  const treeEquivalent = Math.round(co2Saved / 21)

  // Carbon age (planet burden equivalent)
  const carbonAge = Math.round(25 + (currentAnnualKg / 1000) * 5)
  const carbonAgeWithApp = Math.round(carbonAge * 0.7)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#e0e0e0] rounded p-3 text-sm shadow-sm">
          <p className="font-medium text-[#1a3d2b] mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>
              {p.name}: {p.value} tonnes
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="border border-[#e0e0e0] rounded-lg p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-[#666] mb-1">
          Future Self Projection
        </p>
        <h3
          style={{ fontFamily: 'DM Serif Display' }}
          className="text-2xl text-[#1a3d2b]"
        >
          Two Paths Forward
        </h3>
        <p className="text-sm text-[#666] mt-1">
          Your carbon trajectory over the next 10 years
        </p>
      </div>

      {/* Chart */}
      <div className="h-56 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}t`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="Do Nothing"
              stroke="#e76f51"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="With CarbonIQ"
              stroke="#1a3d2b"
              strokeWidth={2.5}
              dot={{ fill: '#1a3d2b', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Path Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Path A */}
        <div className="border border-red-100 rounded p-4 bg-red-50">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
            Path A — Do Nothing
          </p>
          <p className="text-2xl font-bold text-red-700 mb-1">
            {(tenYearDoNothing / 1000).toFixed(1)}t
          </p>
          <p className="text-xs text-red-500">total by {currentYear + 10}</p>
          <div className="mt-3 pt-3 border-t border-red-100 space-y-1">
            <p className="text-xs text-red-600">
              Carbon age: <strong>{carbonAge} years</strong>
            </p>
            <p className="text-xs text-red-600">
              Cost to planet:{' '}
              <strong>
                ₹{((tenYearDoNothing / 1000) * COST_PER_TONNE).toLocaleString('en-IN')}
              </strong>
            </p>
          </div>
        </div>

        {/* Path B */}
        <div className="border border-[#b7e4c7] rounded p-4 bg-[#f0faf4]">
          <p className="text-xs font-medium text-[#1a3d2b] uppercase tracking-wide mb-2">
            Path B — With CarbonIQ
          </p>
          <p className="text-2xl font-bold text-[#1a3d2b] mb-1">
            {(tenYearWithApp / 1000).toFixed(1)}t
          </p>
          <p className="text-xs text-[#2d6a4f]">total by {currentYear + 10}</p>
          <div className="mt-3 pt-3 border-t border-[#b7e4c7] space-y-1">
            <p className="text-xs text-[#1a3d2b]">
              Carbon age: <strong>{carbonAgeWithApp} years 🌱</strong>
            </p>
            <p className="text-xs text-[#1a3d2b]">
              Money saved:{' '}
              <strong>₹{moneySaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-[#f5f0e8] rounded p-4">
        <p className="text-xs font-medium text-[#1a3d2b] uppercase tracking-wide mb-3">
          By choosing Path B, over 10 years you save:
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-[#1a3d2b]">
              {(co2Saved / 1000).toFixed(1)}t
            </p>
            <p className="text-xs text-[#666]">CO₂ avoided</p>
          </div>
          <div className="border-x border-[#e0d8cc]">
            <p className="text-xl font-bold text-[#1a3d2b]">
              ₹{(moneySaved / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-[#666]">money saved</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#1a3d2b]">
              {treeEquivalent}
            </p>
            <p className="text-xs text-[#666]">trees worth</p>
          </div>
        </div>
      </div>

      {streak > 0 && (
        <p className="text-xs text-[#2d6a4f] mt-3 text-center">
          🔥 Your {streak}-day streak is already pushing you toward Path B
        </p>
      )}
    </div>
  )
}
