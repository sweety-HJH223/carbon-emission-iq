'use client'

import Link from 'next/link'
import FeatureBox from './FeatureBox'
import { useAuth } from '@/lib/AuthContext'
import CarbonDebtClock from '@/components/CarbonDebtClock'

export default function HomePage() {
  const { user, profile } = useAuth()
  const annualEstimate = profile ? (profile.totalCO2 / 1000).toFixed(2) : "0.00"

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-5xl md:text-6xl font-bold text-[#1a3d2b] mb-4 leading-tight"
          >
            Know Your Earth Debt.
          </h1>
          <p className="text-lg text-[#666] mb-8 max-w-2xl mx-auto">
            Track your personal carbon footprint with precision. Every action matters.
          </p>
          <Link
            href="/calculate"
            className="inline-block bg-[#1a3d2b] text-white px-8 py-3 rounded hover:bg-[#2d6a4f] transition-colors"
          >
            Start Tracking
          </Link>
        </div>

        {/* Animated Counter */}
        <div className="border border-[#e0e0e0] rounded p-8 md:p-12 bg-[#f5f0e8] text-center mb-16">
          <p className="text-sm text-[#666] mb-2">{user ? "Your Recorded Footprint" : "Current Annual Estimate"}</p>
          <p className="text-5xl md:text-6xl font-bold text-[#1a3d2b]">
            {user ? annualEstimate : "4.2"}
          </p>
          <p className="text-lg text-[#999] mt-2">tonnes CO₂ {user ? "logged" : "per year (avg)"}</p>
        </div>

        <CarbonDebtClock totalCO2Kg={profile?.totalCO2 || 0} />

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <FeatureBox
            icon="✍️"
            title="Type It"
            description="Manually enter your daily activities and we'll calculate the carbon impact instantly."
          />
          <FeatureBox
            icon="📸"
            title="Scan Bill"
            description="Upload your receipts and bills—our AI detects products and calculates emissions."
          />
          <FeatureBox
            icon="🛂"
            title="Carbon Passport"
            description="Get your personalized carbon passport with detailed insights and comparisons."
          />
        </div>

        {/* How It Works */}
        <section className="mb-16">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-3xl md:text-4xl font-bold text-[#1a3d2b] text-center mb-12"
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1a3d2b] mb-4">1</div>
              <h3 className="font-bold text-[#1a3d2b] mb-2">Log Your Activity</h3>
              <p className="text-sm text-[#666]">
                Type what you did or upload a receipt—be specific for accuracy.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1a3d2b] mb-4">2</div>
              <h3 className="font-bold text-[#1a3d2b] mb-2">We Calculate Impact</h3>
              <p className="text-sm text-[#666]">
                Our algorithm converts activities into CO₂ emissions with precision.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1a3d2b] mb-4">3</div>
              <h3 className="font-bold text-[#1a3d2b] mb-2">Track & Improve</h3>
              <p className="text-sm text-[#666]">
                View trends, get recommendations, and compete in challenges.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#f5f0e8] rounded p-8 md:p-12 text-center">
          <h2
            style={{ fontFamily: 'DM Serif Display' }}
            className="text-3xl font-bold text-[#1a3d2b] mb-4"
          >
            Ready to reduce your impact?
          </h2>
          <p className="text-[#666] mb-6">
            Join thousands of users taking control of their carbon footprint.
          </p>
          <Link
            href="/calculate"
            className="inline-block bg-[#1a3d2b] text-white px-8 py-3 rounded hover:bg-[#2d6a4f] transition-colors"
          >
            Begin Now
          </Link>
        </section>
      </section>
    </main>
  )
}
