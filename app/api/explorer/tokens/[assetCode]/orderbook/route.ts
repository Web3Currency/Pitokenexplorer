import { NextResponse } from "next/server"
import { getOrderBook } from "@/lib/horizon-fetcher"

export async function GET(request: Request, { params }: { params: Promise<{ assetCode: string }> }) {
  const { assetCode } = await params
  const issuer = new URL(request.url).searchParams.get("issuer")
  if (!assetCode || !issuer) {
    return NextResponse.json({ error: "asset and issuer are required" }, { status: 400 })
  }
  const book = await getOrderBook(assetCode, issuer)
  return NextResponse.json(book)
}
