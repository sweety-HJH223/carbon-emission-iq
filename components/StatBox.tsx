interface StatBoxProps {
  label: string
  value: string | number
  unit?: string
  subtitle?: string
}

export default function StatBox({ label, value, unit, subtitle }: StatBoxProps) {
  return (
    <div className="border border-[#e0e0e0] rounded p-6">
      <p className="text-sm text-[#666] mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[#1a3d2b]">{value}</span>
        {unit && <span className="text-sm text-[#999]">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-[#999] mt-2">{subtitle}</p>}
    </div>
  )
}
