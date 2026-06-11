interface FeatureBoxProps {
  title: string
  description: string
  icon: string
}

export default function FeatureBox({ title, description, icon }: FeatureBoxProps) {
  return (
    <div className="border border-[#e0e0e0] rounded p-6 hover:shadow-sm transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 style={{ fontFamily: 'DM Serif Display' }} className="text-xl font-bold text-[#1a3d2b] mb-2">
        {title}
      </h3>
      <p className="text-[#666] text-sm leading-relaxed">{description}</p>
    </div>
  )
}
