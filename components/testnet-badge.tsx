export function TestnetBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/65 ${className}`}
      aria-label="Pi Network Testnet"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_9px_rgba(249,115,22,0.75)]" aria-hidden="true" />
      <span>TESTNET</span>
    </div>
  )
}
