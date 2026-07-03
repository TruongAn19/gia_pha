// Chip/pill dùng lại. "Chip đời" = <Badge>Đời 4</Badge> (tone muted mặc định).
const TONES = {
  muted: 'bg-muted text-fg-2',
  accent: 'bg-accent text-fg-inv',
  'accent-soft': 'bg-accent-soft/40 text-accent',
  alive: 'bg-alive-bg text-alive-fg',
  danger: 'bg-danger/10 text-danger',
  outline: 'border border-hairline text-fg-2',
}

export default function Badge({ children, tone = 'muted', dot = false, icon = null, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone] || TONES.muted} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  )
}
