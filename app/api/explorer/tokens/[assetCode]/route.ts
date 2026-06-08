import { NextResponse } from 'next/server';

const PI_HORIZON_URL = 'https://api.testnet.minepi.com';

export async function GET(request: Request, { params }: { params: Promise<{ assetCode: string }> }) {
  try {
    const { assetCode } = await params;
    const url = new URL(request.url);
    const issuer = url.searchParams.get('issuer');

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer is required' }, { status: 400 });
    }

    const assetParam = `${assetCode}:${issuer}`;
    const response = await fetch(`${PI_HORIZON_URL}/liquidity_pools?reserve_asset=${assetParam}&limit=50`);
    if (!response.ok) throw new Error('Failed to fetch pools');
    
    const data = await response.json();
    const pools = data._embedded.records;

    const formattedPools = pools.map((pool: any) => {
      const reserves = pool.reserves;
      const t1 = reserves[0].asset.split(':')[0] || 'PI';
      const t2 = reserves[1].asset.split(':')[0] || 'PI';
      
      return {
        id: pool.id,
        pair: `${t1}/${t2}`,
        liquidity: parseFloat(reserves.find((r: any) => r.asset === 'native')?.amount || '0').toLocaleString(),
        volume24h: null,
        fee: (pool.fee_bp / 100).toFixed(2) + '%'
      };
    });

    return NextResponse.json({
      assetCode,
      issuer,
      pools: formattedPools
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch token details' }, { status: 500 });
  }
}
