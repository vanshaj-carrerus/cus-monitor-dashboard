import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const identity = req.nextUrl.searchParams.get('identity') || '';
  const clientType = (req.nextUrl.searchParams.get('clientType') || 'admin').toLowerCase();
  const actorRole = (req.headers.get('x-actor-role') || '').toLowerCase();

  if (!room || !identity || !['admin', 'agent'].includes(clientType)) {
    console.error(`[Stream Token] Missing room (${room}) or identity (${identity})`);
    return NextResponse.json({ error: 'Missing room/identity or invalid clientType' }, { status: 400 });
  }

  if (clientType === 'admin' && !['admin', 'manager'].includes(actorRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  console.log(`[Stream Token] Generating ${clientType} token for room: ${room}, identity: ${identity}`);

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: identity,
  });

  at.addGrant({
    roomJoin: true,
    room: room,
    canPublish: clientType === 'agent',
    canSubscribe: true,
    canPublishData: clientType === 'admin',
  });

  return NextResponse.json({
    token: await at.toJwt(),
    url: wsUrl
  });
}
