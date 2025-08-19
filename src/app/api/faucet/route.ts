import { NextRequest } from 'next/server';
import { requestSuiFromFaucetV2, getFaucetHost } from '@mysten/sui/faucet';

export const runtime = 'nodejs';

type Net = 'devnet' | 'testnet' | 'mainnet';

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(200, { ok: false, error: 'bad_request', detail: 'Invalid JSON body' });
  }

  const network = ((body?.network as string) || 'devnet').toLowerCase() as Net;
  const recipient = body?.recipient as string | undefined;

  if (!recipient) {
    return json(200, { ok: false, error: 'bad_params', detail: 'Missing recipient (0x...)' });
  }

  // Mainnet: no faucet available
  if (network === 'mainnet') {
    return json(200, {
      ok: false,
      error: 'unsupported_network',
      detail: 'Mainnet has no faucet. Use an exchange or bridge.',
    });
  }

  if (network !== 'devnet' && network !== 'testnet') {
    return json(200, {
      ok: false,
      error: 'bad_params',
      detail: 'Expected { network: "devnet" | "testnet" | "mainnet", recipient: "0x..." }',
    });
  }

  const host = getFaucetHost(network);

  // Retry a few times for transient errors; stop early on rate-limits
  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      const receipt = await requestSuiFromFaucetV2({ host, recipient });
      return json(200, { ok: true, receipt });
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const rateLimited = /429|too many requests|rate/i.test(msg);

      if (rateLimited) {
        // Most public faucets are per-IP/day. Signal cooldown to client (24h hint).
        return json(200, {
          ok: false,
          error: 'rate_limited',
          detail: msg,
          rateLimited: true,
          retryAfterSeconds: 24 * 60 * 60,
        });
      }

      const isLast = i === attempts - 1;
      if (isLast) {
        return json(200, { ok: false, error: 'faucet_failed', detail: msg });
      }

      // Exponential backoff with jitter: 1s, 2s, 4s (+ up to 300ms)
      const base = 1000 * Math.pow(2, i);
      const jitter = Math.floor(Math.random() * 300);
      await sleep(base + jitter);
    }
  }

  return json(200, { ok: false, error: 'unknown' });
}
