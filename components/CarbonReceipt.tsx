'use client'

import { useRef, useState } from 'react'

interface CarbonReceiptProps {
  activity: string
  co2_kg: number
  category: string
  calculation: string
  tip: string
  totalDebt?: number 
  onClose?: () => void
}

const COST_PER_KG = 4.25

export default function CarbonReceipt({
  activity,
  co2_kg,
  category,
  calculation,
  tip,
  totalDebt = 0,
  onClose,
}: CarbonReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [shared, setShared] = useState(false)
  const [copied, setCopied] = useState(false)

  const earthCost = (co2_kg * COST_PER_KG).toFixed(2)
  const trees = (co2_kg / 21).toFixed(2)
  const phoneCharges = Math.round(co2_kg * 120)
  const carKm = (co2_kg / 0.21).toFixed(1)
  const totalDebtRupees = (totalDebt * COST_PER_KG).toFixed(0)

  const receiptId = `CIQ-${Date.now().toString(36).toUpperCase().slice(-6)}`
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  })

  const categoryEmoji: Record<string, string> = {
    Travel: '🚗',
    Energy: '⚡',
    Food: '🍽️',
    Shopping: '🛍️',
    Waste: '♻️',
  }

  const handleShare = async () => {
    const shareText = `🌍 My Carbon Receipt\n\n${categoryEmoji[category] || '🌱'} ${activity}\n\nCO₂: ${co2_kg} kg\nEarth cost: ₹${earthCost}\nTrees needed: ${trees}\n\nTrack yours at CarbonIQ 👇\n#CarbonIQ #KnowYourDebt #ClimateAction`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Carbon Receipt — CarbonIQ',
          text: shareText,
        })
        setShared(true)
      } catch (e) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleLinkedIn = () => {
    const text = encodeURIComponent(
      `I just tracked my carbon footprint using CarbonIQ! 🌍\n\n${activity} = ${co2_kg} kg CO₂\nTrue cost to the planet: ₹${earthCost}\n\nSmall awareness leads to big change. Tracking my 1% daily reduction.\n\n#CarbonIQ #Sustainability #ClimateAction #GreenTech`
    )
    window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-y-auto">

        {/* Receipt */}
        <div ref={receiptRef} className="bg-[#fafaf8] font-mono">

          {/* Torn top edge */}
          <div
            className="h-4 w-full"
            style={{
              background: 'white',
              clipPath: 'polygon(0 0, 3% 100%, 6% 0, 9% 100%, 12% 0, 15% 100%, 18% 0, 21% 100%, 24% 0, 27% 100%, 30% 0, 33% 100%, 36% 0, 39% 100%, 42% 0, 45% 100%, 48% 0, 51% 100%, 54% 0, 57% 100%, 60% 0, 63% 100%, 66% 0, 69% 100%, 72% 0, 75% 100%, 78% 0, 81% 100%, 84% 0, 87% 100%, 90% 0, 93% 100%, 96% 0, 99% 100%, 100% 0)',
            }}
          />

          <div className="px-6 pb-2 bg-[#fafaf8]">
            {/* Header */}
            <div className="text-center py-4 border-b border-dashed border-[#ccc]">
              <p className="text-lg font-bold tracking-widest text-[#1a3d2b]">
                🌍 CARBONIQ
              </p>
              <p className="text-xs text-[#666] tracking-wide">
                CARBON RECEIPT
              </p>
              <p className="text-xs text-[#999] mt-1">
                {dateStr} · {timeStr}
              </p>
              <p className="text-xs text-[#999]">
                Receipt #{receiptId}
              </p>
            </div>

            {/* Activity */}
            <div className="py-4 border-b border-dashed border-[#ccc]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs text-[#999] uppercase tracking-wide mb-1">
                    {categoryEmoji[category]} {category}
                  </p>
                  <p className="text-sm text-[#333] leading-snug">{activity}</p>
                  <p className="text-xs text-[#999] mt-1">{calculation}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-[#1a3d2b]">{co2_kg}</p>
                  <p className="text-xs text-[#666]">kg CO₂</p>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="py-4 border-b border-dashed border-[#ccc] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Earth cost (₹{COST_PER_KG}/kg)</span>
                <span className="font-bold text-[#1a3d2b]">₹{earthCost}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Trees needed to offset</span>
                <span className="font-bold text-[#1a3d2b]">{trees} trees</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Equivalent phone charges</span>
                <span className="font-bold text-[#1a3d2b]">{phoneCharges}×</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Or driving by petrol car</span>
                <span className="font-bold text-[#1a3d2b]">{carKm} km</span>
              </div>
            </div>

            {/* Running Total */}
            <div className="py-4 border-b border-dashed border-[#ccc]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#666]">Running Earth Debt</span>
                <span className="font-bold text-red-600">₹{Number(totalDebtRupees).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Total CO₂ logged</span>
                <span className="font-bold text-[#333]">{totalDebt.toFixed(1)} kg</span>
              </div>
            </div>

            {/* AI Tip */}
            <div className="py-4 border-b border-dashed border-[#ccc]">
              <p className="text-xs text-[#999] uppercase tracking-wide mb-1">
                💡 AI Tip
              </p>
              <p className="text-xs text-[#555] leading-relaxed">{tip}</p>
            </div>

            {/* Footer */}
            <div className="py-4 text-center">
              <p className="text-xs text-[#999] mb-3">
                Track. Understand. Reduce.
              </p>
              
    

              <p className="text-xs font-bold text-[#1a3d2b] tracking-widest">
                CARBONIQ.APP
              </p>
              <p className="text-xs text-[#ccc] mt-2">
                #KnowYourDebt #CarbonIQ
              </p>
            </div>
          </div>

          {/* Torn bottom edge */}
          <div
            className="h-4 w-full"
            style={{
              background: 'white',
              clipPath: 'polygon(0 100%, 3% 0, 6% 100%, 9% 0, 12% 100%, 15% 0, 18% 100%, 21% 0, 24% 100%, 27% 0, 30% 100%, 33% 0, 36% 100%, 39% 0, 42% 100%, 45% 0, 48% 100%, 51% 0, 54% 100%, 57% 0, 60% 100%, 63% 0, 66% 100%, 69% 0, 72% 100%, 75% 0, 78% 100%, 81% 0, 84% 100%, 87% 0, 90% 100%, 93% 0, 96% 100%, 99% 0, 100% 100%)',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white space-y-2">
          <button
            onClick={handleShare}
            className="w-full bg-[#1a3d2b] text-white py-3 rounded text-sm font-medium hover:bg-[#2d6a4f] transition-colors flex items-center justify-center gap-2"
          >
            {copied ? '✓ Copied to clipboard!' : shared ? '✓ Shared!' : '📤 Share Receipt'}
          </button>

          <button
            onClick={handleLinkedIn}
            className="w-full border border-[#0077b5] text-[#0077b5] py-3 rounded text-sm font-medium hover:bg-[#f0f7ff] transition-colors flex items-center justify-center gap-2"
          >
            🔗 Post to LinkedIn
          </button>

          <button
            onClick={onClose}
            className="w-full text-[#999] py-2 text-sm hover:text-[#666] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
