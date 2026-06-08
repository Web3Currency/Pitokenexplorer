import { NextResponse } from 'next/server';

export async function GET() {
  // Horizon doesn't have a direct 'domains' endpoint in the same way, 
  // we'll mock it for now but structure it to be served via API
  const domains = [
    {
      id: "1",
      rank: 1,
      name: "pi.network",
      registrar: "GBPI7...NETPI",
      price: "1000.00",
      registered: "2024-01-15",
      expires: "2026-01-15",
      verified: true,
      icon: "🌐",
      color: "from-purple-500 to-purple-700",
    }
  ];
  return NextResponse.json(domains);
}
