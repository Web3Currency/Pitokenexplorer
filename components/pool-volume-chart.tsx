"use client"

import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { Loader2, BarChart3 } from "lucide-react"
import { usePoolVolume, type PoolVolumeDataPoint } from "@/lib/use-market-data"

type TimeRange = "24h" | "7d" | "30d"

interface PoolVolumeChartProps {
  poolId: string
  tokenCode: string
}

export function PoolVolumeChart({ poolId, tokenCode }: PoolVolumeChartProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>("24h")
  const { data, isLoading, error } = usePoolVolume(poolId)

  const chartData = useMemo(() => {
    if (!data) return []
    return data[activeRange] || []
  }, [data, activeRange])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    if (activeRange === "24h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
    return value.toFixed(2)
  }

  const totalVolume = useMemo(() => {
    return chartData.reduce((sum, dp) => sum + dp.volumePI, 0)
  }, [chartData])

  const hasData = chartData.length > 0 && totalVolume > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume (PI)</span>
        <div className="flex gap-1">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                "text-[10px] px-2 py-1 rounded font-medium transition-colors",
                activeRange === range ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-32 bg-muted/30 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-xs">Loading volume data...</span>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-6 w-6 opacity-50 mb-2" />
            <span className="text-xs">Failed to load volume data</span>
          </div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-6 w-6 opacity-50 mb-2" />
            <span className="text-xs">No volume data available yet</span>
          </div>
        ) : (
          <div className="h-full p-2">
            <div className="text-sm font-semibold mb-1 px-2">{formatVolume(totalVolume)} PI total</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id={`volumeGradient-${poolId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  tick={{ fontSize: 9 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={formatVolume}
                  tick={{ fontSize: 9 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as PoolVolumeDataPoint
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <div className="text-xs text-muted-foreground">{formatTimestamp(data.timestamp)}</div>
                        <div className="text-sm font-semibold">{formatVolume(data.volumePI)} PI</div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volumePI"
                  stroke="hsl(var(--primary))"
                  fill={`url(#volumeGradient-${poolId})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
