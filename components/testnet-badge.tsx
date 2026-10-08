export function TestnetBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70 ${className}`}
      aria-label="Pi Network Testnet active"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" aria-hidden="true" />
      <span>TESTNET</span>
      <span className="text-orange-500/80">ACTIVE</span>
    </div>
  )
}
