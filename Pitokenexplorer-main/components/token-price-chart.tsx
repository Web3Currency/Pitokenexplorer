"use client"

import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { Loader2, TrendingUp, TrendingDown, BarChart2 } from "lucide-react"
import { useTokenPriceHistory, type TokenPriceDataPoint } from "@/lib/use-market-data"

type TimeRange = "24h" | "7d" | "30d"

interface TokenPriceChartProps {
  assetCode: string
  assetIssuer: string
}

// Accent color used throughout the chart — a vivid indigo that works on both light and dark backgrounds
const CHART_COLOR = "#6366f1"
const CHART_COLOR_POSITIVE = "#22c55e"
const CHART_COLOR_NEGATIVE = "#ef4444"

export function TokenPriceChart({ assetCode, assetIssuer }: TokenPriceChartProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>("24h")
  const { data, isLoading, error } = useTokenPriceHistory(assetCode, assetIssuer)

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

  const formatPrice = (value: number) => {
    if (value >= 1) return value.toFixed(2)
    if (value >= 0.01) return value.toFixed(4)
    if (value >= 0.0001) return value.toFixed(6)
    return value.toExponential(2)
  }

  const { latestPrice, priceChange } = useMemo(() => {
    if (chartData.length === 0) return { latestPrice: null, priceChange: null }

    const latest = chartData[chartData.length - 1]?.pricePI
    const first = chartData[0]?.pricePI

    if (!latest || !first) return { latestPrice: latest || null, priceChange: null }

    const change = ((latest - first) / first) * 100
    return { latestPrice: latest, priceChange: change }
  }, [chartData])

  const hasData = chartData.length > 0
  const isPositive = priceChange !== null && priceChange >= 0
  const lineColor = priceChange === null ? CHART_COLOR : isPositive ? CHART_COLOR_POSITIVE : CHART_COLOR_NEGATIVE
  const gradientId = `priceGradient-${assetCode}`

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price Chart</span>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all",
                activeRange === range
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Price summary */}
      {hasData && (
        <div className="flex items-baseline gap-2 px-4 pb-3">
          <span className="text-xl font-bold tabular-nums">
            {latestPrice ? `${formatPrice(latestPrice)} π` : "—"}
          </span>
          {priceChange !== null && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                isPositive
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400",
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      {/* Chart area */}
      <div className="h-44">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">Loading price data...</span>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <TrendingUp className="h-5 w-5 opacity-40" />
            <span className="text-xs">Failed to load price data</span>
          </div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <BarChart2 className="h-5 w-5 opacity-40" />
            <span className="text-xs">No price data available yet</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickFormatter={formatPrice}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                width={50}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const point = payload[0].payload as TokenPriceDataPoint
                  return (
                    <div
                      style={{ background: "var(--popover)", border: "1px solid var(--border)" }}
                      className="rounded-lg px-3 py-2 shadow-xl"
                    >
                      <div className="text-[10px] text-muted-foreground mb-0.5">
                        {formatTimestamp(point.timestamp)}
                      </div>
                      <div className="text-sm font-bold" style={{ color: lineColor }}>
                        {formatPrice(point.pricePI)} π
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="pricePI"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
