interface StatBoxProps {
  label: string
  value: string | number
  unit?: string
  subtitle?: string
  isDoom?: boolean
}

export default function StatBox({ label, value, unit, subtitle, isDoom }: StatBoxProps) {
  return (
    <div className={`border rounded p-6 transition-colors ${isDoom ? 'bg-[#262626] border-[#333]' : 'bg-white border-[#e0e0e0]'}`}>
      <p className={`text-sm mb-2 ${isDoom ? 'text-[#666]' : 'text-[#666]'}`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${isDoom ? 'text-[#e76f51]' : 'text-[#1a3d2b]'}`}>{value}</span>
        {unit && <span className={`text-sm ${isDoom ? 'text-[#444]' : 'text-[#999]'}`}>{unit}</span>}
      </div>
      {subtitle && <p className={`text-xs mt-2 ${isDoom ? 'text-[#444]' : 'text-[#999]'}`}>{subtitle}</p>}
    </div>
  )
}
