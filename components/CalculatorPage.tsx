'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { saveActivityLog } from '@/lib/db'
import CarbonReceipt from '@/components/CarbonReceipt'
interface AnalysisResult {
  extracted: {
    activity: string
    quantity: number
    unit: string
    confidence: 'high' | 'medium' | 'low'
  }
  co2_kg: number
  calculation: string
  category: string
  tip: string
  comparison: string
  needs_confirmation: boolean
}

export default function CalculatorPage() {
  const { user, profile } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'type' | 'scan'>('type')
  const [typeInput, setTypeInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stages: 'input' | 'confirm' | 'result'
  const [stage, setStage] = useState<'input' | 'confirm' | 'result'>('input')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [savedToDashboard, setSavedToDashboard] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  const categories = ['Travel', 'Energy', 'Food', 'Shopping', 'Waste']

  // ── ANALYZE TEXT ──────────────────────────────────────
  const handleAnalyzeText = async () => {
    if (!typeInput.trim() || typeInput.trim().length < 5) {
      setError('Please describe your activity in a bit more detail.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: typeInput,
          category: selectedCategory,
          userId: user?.uid || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysisResult(data.result)

      // If AI is confident → go straight to result
      // If not → show confirmation screen
      if (data.result.needs_confirmation) {
        setStage('confirm')
      } else {
        setStage('result')
        if (user) setSavedToDashboard(true)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── SCAN IMAGE ────────────────────────────────────────
  const handleScanImage = async () => {
    if (!uploadFile) {
      setError('Please upload an image first.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('image', uploadFile)
      formData.append('userId', user?.uid || '')
      formData.append('confirmed', 'false') // don't auto-save, show confirmation

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')

      setAnalysisResult(data.result)
      // Always show confirmation for image scans
      setStage('confirm')
    } catch (err: any) {
      setError(err.message || 'Image scan failed. Try a clearer photo.')
    } finally {
      setLoading(false)
    }
  }

  // ── CONFIRM & SAVE ────────────────────────────────────
  const handleConfirm = async () => {
    if (!analysisResult) return
    setLoading(true)

    try {
      if (user) {
        await saveActivityLog({
          userId: user.uid,
          activity: analysisResult.extracted.activity,
          category: analysisResult.category,
          co2_kg: analysisResult.co2_kg,
          calculation: analysisResult.calculation,
          tip: analysisResult.tip,
          comparison: analysisResult.comparison,
        })
        setSavedToDashboard(true)
      }
      setStage('result')
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── FILE UPLOAD ───────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setError(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setUploadFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const reset = () => {
    setStage('input')
    setTypeInput('')
    setSelectedCategory('')
    setUploadFile(null)
    setImagePreview(null)
    setAnalysisResult(null)
    setSavedToDashboard(false)
    setError(null)
  }

  // ── CONFIDENCE COLOR ──────────────────────────────────
  const confidenceColor = {
    high: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-red-600 bg-red-50',
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-2xl mx-auto">

        <h1
          style={{ fontFamily: 'DM Serif Display' }}
          className="text-4xl md:text-5xl font-bold text-[#1a3d2b] mb-4 text-center"
        >
          Calculate Your Impact
        </h1>
        <p className="text-center text-[#666] mb-12">
          Type what you did, or upload a bill for AI analysis.
        </p>

        {/* ── INPUT STAGE ── */}
        {stage === 'input' && (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-[#e0e0e0]">
              <button
                onClick={() => { setActiveTab('type'); setUploadFile(null); setImagePreview(null); setError(null) }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'type'
                    ? 'border-[#1a3d2b] text-[#1a3d2b]'
                    : 'border-transparent text-[#666] hover:text-[#1a3d2b]'
                }`}
              >
                📝 Type It
              </button>
              <button
                onClick={() => { setActiveTab('scan'); setTypeInput(''); setError(null) }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'scan'
                    ? 'border-[#1a3d2b] text-[#1a3d2b]'
                    : 'border-transparent text-[#666] hover:text-[#1a3d2b]'
                }`}
              >
                📷 Scan Bill
              </button>
            </div>

            {/* Type It */}
            {activeTab === 'type' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#1a3d2b] mb-3">
                    What did you do today?
                  </label>
                  <textarea
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    placeholder={`e.g. "drove 45km in my petrol car today"\ne.g. "had chicken biryani for lunch"\ne.g. "my electricity bill was 234 units this month"`}
                    className="w-full border border-[#e0e0e0] rounded p-4 focus:outline-none focus:ring-2 focus:ring-[#1a3d2b] resize-none text-sm"
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a3d2b] mb-3">
                    Category (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                        className={`px-4 py-2 border rounded text-sm transition-colors ${
                          selectedCategory === cat
                            ? 'bg-[#1a3d2b] text-white border-[#1a3d2b]'
                            : 'border-[#1a3d2b] text-[#1a3d2b] hover:bg-[#f5f0e8]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleAnalyzeText}
                  disabled={loading || !typeInput.trim()}
                  className="w-full bg-[#1a3d2b] text-white py-4 rounded font-medium hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Analyzing with AI...
                    </>
                  ) : (
                    'Analyze My Footprint →'
                  )}
                </button>
              </div>
            )}

            {/* Scan Bill */}
            {activeTab === 'scan' && (
              <div className="space-y-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-[#1a3d2b] rounded p-8 text-center bg-[#f5f0e8] cursor-pointer hover:bg-[#ede8e0] transition-colors"
                >
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded border border-[#e0e0e0] object-contain"
                        />
                        <p className="text-sm text-[#1a3d2b] font-medium">✓ {uploadFile?.name}</p>
                        <p className="text-xs text-[#666]">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-4xl">📸</p>
                        <p className="font-medium text-[#1a3d2b]">
                          Drop your electricity bill, fuel receipt here
                        </p>
                        <p className="text-sm text-[#666]">
                          or click to browse • JPG, PNG, PDF supported
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleScanImage}
                  disabled={loading || !uploadFile}
                  className="w-full bg-[#1a3d2b] text-white py-4 rounded font-medium hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Scanning with AI Vision...
                    </>
                  ) : (
                    'Extract & Calculate →'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CONFIRMATION STAGE ── */}
        {stage === 'confirm' && analysisResult && (
          <div className="space-y-6">
            <div className="border border-[#e0e0e0] rounded p-6">
              <p className="text-sm text-[#666] mb-4 font-medium uppercase tracking-wide">
                We detected:
              </p>

              <p className="text-2xl font-bold text-[#1a3d2b] mb-2">
                {analysisResult.extracted.quantity} {analysisResult.extracted.unit}
              </p>
              <p className="text-[#666] mb-4">{analysisResult.extracted.activity}</p>

              <span className={`text-xs px-2 py-1 rounded font-medium ${confidenceColor[analysisResult.extracted.confidence]}`}>
                Confidence: {analysisResult.extracted.confidence}
              </span>
            </div>

            <div className="bg-[#f5f0e8] rounded p-4 text-sm text-[#666]">
              <strong className="text-[#1a3d2b]">Calculation: </strong>
              {analysisResult.calculation} = {analysisResult.co2_kg} kg CO₂
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 border border-[#1a3d2b] text-[#1a3d2b] py-3 rounded font-medium hover:bg-[#f5f0e8] transition-colors"
              >
                ← Edit
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-[#1a3d2b] text-white py-3 rounded font-medium hover:bg-[#2d6a4f] transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Confirm & Save ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ── RESULT STAGE ── */}
        {stage === 'result' && analysisResult && (
          <div className="space-y-6">
            {showReceipt && (
  <CarbonReceipt
    activity={analysisResult.extracted.activity}
    co2_kg={analysisResult.co2_kg}
    category={analysisResult.category}
    calculation={analysisResult.calculation}
    tip={analysisResult.tip}
    totalDebt={profile?.totalCO2 || 0}
    onClose={() => setShowReceipt(false)}
  />
)}

            {/* CO2 Number */}
            <div className="border border-[#e0e0e0] rounded p-8 bg-[#f5f0e8] text-center">
              <p className="text-sm text-[#666] mb-2 uppercase tracking-wide">Carbon Emitted</p>
              <p className="text-7xl font-bold text-[#1a3d2b] mb-1">
                {analysisResult.co2_kg}
              </p>
              <p className="text-lg text-[#999]">kg CO₂</p>
              {savedToDashboard && (
                <p className="text-xs text-green-600 mt-3 font-medium">
                  ✓ Saved to your Carbon Passport
                </p>
              )}
              {!user && (
                <p className="text-xs text-[#999] mt-3">
                  Sign in to save this to your passport
                </p>
              )}
            </div>

            {/* Comparison */}
            <div className="border border-[#e0e0e0] rounded p-5">
              <p className="text-xs font-medium text-[#666] uppercase tracking-wide mb-2">
                What this means
              </p>
              <p className="text-[#1a3d2b] font-medium">{analysisResult.comparison}</p>
            </div>

            {/* Calculation */}
            <div className="border border-[#e0e0e0] rounded p-5">
              <p className="text-xs font-medium text-[#666] uppercase tracking-wide mb-2">
                Calculation
              </p>
              <p className="text-[#666] text-sm font-mono">{analysisResult.calculation}</p>
            </div>

            {/* AI Tip */}
            <div className="bg-[#f5f0e8] rounded p-5">
              <p className="text-xs font-medium text-[#1a3d2b] uppercase tracking-wide mb-2">
                💡 AI Tip
              </p>
              <p className="text-[#555] text-sm leading-relaxed">{analysisResult.tip}</p>
            </div>

            <button
              onClick={() => setShowReceipt(true)}
              className="w-full bg-white border border-[#1a3d2b] text-[#1a3d2b] py-3 rounded font-medium hover:bg-[#f5f0e8] transition-colors flex items-center justify-center gap-2"
            >
              📄 View Carbon Receipt
            </button>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={reset}
                className="flex-1 border border-[#1a3d2b] text-[#1a3d2b] py-3 rounded font-medium hover:bg-[#f5f0e8] transition-colors"
              >
                Log Another Activity
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-[#1a3d2b] text-white py-3 rounded font-medium hover:bg-[#2d6a4f] transition-colors"
              >
                View Dashboard →
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}