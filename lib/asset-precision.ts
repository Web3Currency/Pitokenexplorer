/**
 * Canonical asset-amount formatting for the explorer.
 *
 * Classic Stellar/Pi asset amounts use seven decimal places.
 * Keep raw database/Horizon values unmodified and apply this formatter
 * only at the user-facing boundary.
 */
export const ASSET_DECIMALS = 7

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

function incrementInteger(value: string): string {
  const digits = value.split("")
  let carry = 1

  for (let i = digits.length - 1; i >= 0 && carry; i--) {
    if (digits[i] === "9") {
      digits[i] = "0"
    } else {
      digits[i] = String(Number(digits[i]) + 1)
      carry = 0
    }
  }

  return carry ? `1${digits.join("")}` : digits.join("")
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
  let integerPart = integerPartRaw || "0"

  const fraction = fractionPart.padEnd(ASSET_DECIMALS + 1, "0")
  const kept = fraction.slice(0, ASSET_DECIMALS)
  const nextDigit = fraction[ASSET_DECIMALS]

  let fractional = kept.padEnd(ASSET_DECIMALS, "0")
  if (nextDigit && nextDigit >= "5") {
    const roundedFraction = Number(fractional) + 1
    if (roundedFraction >= 10_000_000) {
      integerPart = incrementInteger(integerPart)
      fractional = "0".repeat(ASSET_DECIMALS)
    } else {
      fractional = String(roundedFraction).padStart(ASSET_DECIMALS, "0")
    }
  }

  return `${negative ? "-" : ""}${integerPart}.${fractional}`
}

/**
 * Format an asset amount with a unit suffix such as PI.
 */
export function formatAssetValue(value: unknown, unit = ""): string {
  const formatted = formatAssetAmount(value)
  return formatted ? `${formatted}${unit ? ` ${unit}` : ""}` : ""
}
