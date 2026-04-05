export function KubaDiamond({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L30 16L16 30L2 16Z" fill="#0D1F2D" stroke="#00D4AA" strokeWidth="1.5" />
      <path d="M12 10V22M12 16L20 10M12 16L20 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="16" r="1.5" fill="#00D4AA" />
    </svg>
  )
}

export function KubaLogo() {
  return (
    <div className="text-sm font-bold leading-none tracking-tight text-white">
      Kuba<span style={{ color: '#00D4AA' }}>Ventures</span>
    </div>
  )
}
