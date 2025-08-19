import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const ENV_MODEL = (process.env.NEXT_PUBLIC_AGENT_MODEL || '').trim();

/** Ordered fallback list. We’ll try each until one works. */
const MODEL_CANDIDATES = [
  ENV_MODEL || undefined,          // honor env if set (e.g., openrouter/auto)
  'openrouter/auto',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-flash-1.5',       // correct Gemini slug
].filter(Boolean) as string[];

/** We’ll try these max token caps progressively smaller on 402 credit errors. */
const MAX_TOKENS_CANDIDATES = [700, 500, 300, 200];

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// Keep chat light: last N messages + per-message char clamp.
// This avoids sending huge context that triggers higher credit usage.
const MAX_HISTORY = 8;
const MESSAGE_CHAR_LIMIT = 1800;
function sanitizeMessages(raw: any[]): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const msgs = (raw || []).slice(-MAX_HISTORY).map((m: any) => {
    const role = (m?.role ?? 'user') as 'user' | 'assistant';
    let content = String(m?.content ?? '');
    if (content.length > MESSAGE_CHAR_LIMIT) content = content.slice(-MESSAGE_CHAR_LIMIT);
    return { role, content };
  });
  return msgs as any;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userMessages = Array.isArray(body?.messages) ? body.messages : [];
    const messages = sanitizeMessages(userMessages);

    if (!OPENROUTER_API_KEY) {
      return json({ ok: false, error: 'missing_api_key', detail: 'Set OPENROUTER_API_KEY' });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const referer = req.headers.get('referer') || origin;
    const title = process.env.NEXT_PUBLIC_SITE_TITLE || 'Sui AI Guide';

    const system = {
      role: 'system',
      content:
        "You are Sui AI Guide — a concise, friendly assistant helping newcomers use Sui. " +
        "When asked about projects (Slush, zkLogin, Walrus, DeepBook, SuiNS, SEAL), explain what it is, why it matters, " +
        "and give 1–2 practical next steps inside THIS app. Avoid speculation.",
    };

    let lastErrText = '';
    for (const model of MODEL_CANDIDATES) {
      for (const maxTokens of MAX_TOKENS_CANDIDATES) {
        try {
          const upstream = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              // Recommended by OpenRouter
              'HTTP-Referer': referer,
              'X-Title': title,
            },
            body: JSON.stringify({
              model,
              stream: true,
              temperature: 0.3,
              max_tokens: maxTokens, // ✅ cap output tokens to fit credit limits
              messages: [system, ...messages],
            }),
          });

          if (!upstream.ok || !upstream.body) {
            const text = await upstream.text().catch(() => '');
            lastErrText = text || `status ${upstream.status}`;

            // If it’s a credit/max_tokens issue (usually 402) → try a smaller cap
            const creditErr =
              upstream.status === 402 ||
              /requires more credits|can only afford|payment required/i.test(lastErrText);

            // Routing/model issues → try next model
            const routingErr =
              upstream.status === 404 ||
              upstream.status === 400 ||
              /not a valid model id|No allowed providers|model not found/i.test(lastErrText);

            if (creditErr) continue; // try next (smaller) max_tokens for same model
            if (routingErr) break;   // break inner loop, try next model

            // Other errors: surface to client
            return json({ ok: false, error: 'upstream_failed', model, detail: lastErrText });
          }

          // Stream SSE -> text/plain
          // ... inside the code path where `upstream.ok && upstream.body` is true

const reader = upstream.body.getReader();
const decoder = new TextDecoder();
const encoder = new TextEncoder();

const stream = new ReadableStream({
  async pull(controller) {
    const { value, done } = await reader.read();
    if (done) {
      controller.close();
      return;
    }

    const chunk = decoder.decode(value);
    for (const raw of chunk.split('\n')) {
      if (!raw.startsWith('data:')) continue;
      const dataStr = raw.slice(5).trim();

      // ✅ actively close the stream on OpenRouter's sentinel
      if (dataStr === '[DONE]') {
        try { reader.cancel(); } catch {}
        controller.close();
        return;
      }

      if (!dataStr) continue;
      try {
        const payload = JSON.parse(dataStr);
        const delta =
          payload?.choices?.[0]?.delta?.content ??
          payload?.choices?.[0]?.message?.content ??
          '';
        if (delta) controller.enqueue(encoder.encode(delta));
      } catch {
        // ignore keep-alives / partials
      }
    }
  },
  cancel() {
    try { reader.cancel(); } catch {}
  },
});

return new Response(stream, {
  status: 200,
  headers: {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'x-agent-model': model,                 // keep your model header if you had it
    'x-agent-max-tokens': String(maxTokens) // keep this if present in your code
  },
});

        } catch (e: any) {
          lastErrText = String(e?.message || e);
          // try next (smaller) max tokens or next model
          continue;
        }
      }
    }

    return json({
      ok: false,
      error: 'no_working_model_or_tokens',
      detail:
        lastErrText ||
        'No model or token limit worked with current credit constraints. Reduce input size or increase credits.',
      triedModels: MODEL_CANDIDATES,
      triedMaxTokens: MAX_TOKENS_CANDIDATES,
    });
  } catch (e: any) {
    return json({ ok: false, error: 'agent_error', detail: e?.message || 'Unknown error' });
  }
}
