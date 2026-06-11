'use client'

import { useEffect, useState, useRef } from 'react'

interface DebtClockProps {
  totalCO2Kg?: number // user's total CO2 in kg, from Firebase
}

// True social cost of carbon: ~$50/tonne globally
// Converted: $50/tonne × 85 INR/$ = ₹4250/tonne = ₹4.25/kg
const COST_PER_KG = 4.25
// Average Indian emits ~1.9 kg CO2 per hour
const CO2_PER_SECOND = 1.9 / 3600

export default function CarbonDebtClock({ totalCO2Kg = 0 }: DebtClockProps) {
  const [displayDebt, setDisplayDebt] = useState(totalCO2Kg * COST_PER_KG)
  const [liveKg, setLiveKg] = useState(totalCO2Kg)
  const animFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const baseKgRef = useRef<number>(totalCO2Kg)

  useEffect(() => {
    baseKgRef.current = totalCO2Kg
    startTimeRef.current = Date.now()

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const newKg = baseKgRef.current + CO2_PER_SECOND * elapsed
      setLiveKg(newKg)
      setDisplayDebt(newKg * COST_PER_KG)
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [totalCO2Kg])

  const formatDebt = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatKg = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(2)} tonnes`
    return `${kg.toFixed(2)} kg`
  }

  // Debt level indicator
  const getLevel = (debt: number) => {
    if (debt < 5000) return { label: 'Low Impact', color: '#52b788', bar: 15 }
    if (debt < 15000) return { label: 'Moderate', color: '#f4a261', bar: 40 }
    if (debt < 30000) return { label: 'High Impact', color: '#e76f51', bar: 65 }
    return { label: 'Critical', color: '#d62828', bar: 90 }
  }

  const level = getLevel(displayDebt)

  return (
    <div className="border border-[#e0e0e0] rounded-lg p-8 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#666] mb-1">
            Your Earth Debt
          </p>
          <p className="text-xs text-[#999]">
            True cost of your carbon emissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-[#999]">Live</span>
        </div>
      </div>

      {/* Big Debt Number */}
      <div className="mb-6">
        <div className="flex items-start gap-1 mb-1">
          <span
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-3xl text-[#1a3d2b] mt-2"
          >
            ₹
          </span>
          <span
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-6xl md:text-7xl font-bold text-[#1a3d2b] tabular-nums leading-none"
          >
            {formatDebt(displayDebt)}
          </span>
        </div>
        <p className="text-sm text-[#666] ml-8">
          = {formatKg(liveKg)} CO₂ × ₹{COST_PER_KG}/kg true social cost
        </p>
      </div>

      {/* Impact Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-[#999] mb-2">
          <span>Low</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ color: level.color, backgroundColor: level.color + '15' }}
          >
            {level.label}
          </span>
          <span>Critical</span>
        </div>
        <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${level.bar}%`,
              backgroundColor: level.color,
            }}
          />
        </div>
      </div>

      {/* Context Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#f0f0f0]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1a3d2b]">
            {(liveKg / 21).toFixed(0)}
          </p>
          <p className="text-xs text-[#999]">trees to offset</p>
        </div>
        <div className="text-center border-x border-[#f0f0f0]">
          <p className="text-lg font-bold text-[#1a3d2b]">
            {(liveKg * 120).toFixed(0)}
          </p>
          <p className="text-xs text-[#999]">phone charges</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#1a3d2b]">
            {(liveKg / 0.21).toFixed(0)} km
          </p>
          <p className="text-xs text-[#999]">by petrol car</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 bg-[#f5f0e8] rounded p-3 text-center">
        <p className="text-xs text-[#555]">
          At ₹{COST_PER_KG}/kg — the true social cost of carbon emissions.
          <span className="text-[#1a3d2b] font-medium">
            {' '}Every kg you save = ₹{COST_PER_KG} back to the planet.
          </span>
        </p>
      </div>
    </div>
  )
}
