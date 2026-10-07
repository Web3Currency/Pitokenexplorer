/**
 * Canonical asset-amount formatting for the explorer.
 *
 * Classic Stellar/Pi asset amounts use seven decimal places.
 * Keep raw database/Horizon values unmodified and apply this formatter
 * only at the user-facing boundary.
 */
export const ASSET_DECIMALS = 7
const SCALE = 10_000_000n

function toPlainDecimal(value: string): string {
  const match = value.trim().match(/^([+-]?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i)
  if (!match) throw new Error(`Invalid decimal value: ${value}`)

  const [, sign, integerPart, fractionPart = "", exponentPart] = match
  const exponent = exponentPart ? Number(exponentPart) : 0
  const digits = integerPart + fractionPart
  const decimalIndex = integerPart.length + exponent

  if (decimalIndex <= 0) {
    return `${sign}0.${"0".repeat(-decimalIndex)}${digits}`
  }

  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`
  }

  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`
}

/**
 * Round an asset amount using decimal string arithmetic (ROUND_HALF_UP)
 * and return exactly seven fractional digits.
 */
export function formatAssetAmount(value: unknown): string {
  if (value === null || value === undefined || value === "") return ""

  const plain = toPlainDecimal(String(value))
  const negative = plain.startsWith("-")
  const unsigned = plain.replace(/^[+-]/, "")
  const [integerPartRaw, fractionPart = ""] = unsigned.split(".")
  const integerPart = integerPartRaw || "0"

  let scaled = BigInt(integerPart) * SCALE
  const fraction = fractionPart.padEnd(ASSET_DECIMALS + 1, "0")
  const kept = fraction.slice(0, ASSET_DECIMALS)
  const nextDigit = fraction[ASSET_DECIMALS]

  scaled += BigInt(kept || "0")
  if (nextDigit && nextDigit >= "5") scaled += 1n

  const whole = scaled / SCALE
  const fractional = (scaled % SCALE).toString().padStart(ASSET_DECIMALS, "0")

  return `${negative ? "-" : ""}${whole.toString()}.${fractional}`
}

/**
 * Format an asset amount with a unit suffix such as PI.
 */
export function formatAssetValue(value: unknown, unit = ""): string {
  const formatted = formatAssetAmount(value)
  return formatted ? `${formatted}${unit ? ` ${unit}` : ""}` : ""
}
