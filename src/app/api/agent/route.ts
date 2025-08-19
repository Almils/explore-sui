import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Safe default if env is missing or malformed
const ENV_MODEL = (process.env.NEXT_PUBLIC_AGENT_MODEL || '').trim();
const DEFAULT_MODEL = ENV_MODEL || 'openrouter/auto';

/** Ordered fallback list. We’ll try each until one works. */
const MODEL_CANDIDATES = [
  DEFAULT_MODEL,
  // Common direct models supported by OpenRouter; order matters:
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet',
  // include both gemini slugs (providers sometimes use either)
  'google/gemini-1.5-flash',
  'google/gemini-flash-1.5',
];

/** We’ll try these max token caps progressively smaller on 402 credit errors. */
const MAX_TOKENS_CANDIDATES = [700, 500, 300, 200];

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// Keep chat light: last N messages + per-message char clamp.
const MAX_HISTORY = 8;
const MESSAGE_CHAR_LIMIT = 1800;

type ChatRole = 'system' | 'user' | 'assistant';
type ChatMsg = { role: ChatRole; content: string };

function sanitizeMessages(raw: unknown): ChatMsg[] {
  const arr = Array.isArray(raw) ? raw : [];
  const trimmed = arr.slice(-MAX_HISTORY).map((m: any) => {
    const role: ChatRole = (m?.role === 'assistant' ? 'assistant' : 'user');
    let content = String(m?.content ?? '');
    if (content.length > MESSAGE_CHAR_LIMIT) content = content.slice(-MESSAGE_CHAR_LIMIT);
    return { role, content };
  });
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userMessages = sanitizeMessages(body?.messages);

    if (!OPENROUTER_API_KEY) {
      return json({ ok: false, error: 'missing_api_key', detail: 'Set OPENROUTER_API_KEY' });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const referer = req.headers.get('referer') || origin;
    const title = (process.env.NEXT_PUBLIC_SITE_TITLE || 'Sui AI Guide').trim() || 'Sui AI Guide';

    const system: ChatMsg = {
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
              // OpenRouter analytics / attribution
              'HTTP-Referer': referer,
              'X-Title': title,
            },
            body: JSON.stringify({
              model,
              stream: true,
              temperature: 0.3,
              max_tokens: maxTokens, // cap output to fit credit limits
              messages: [system, ...userMessages],
            }),
          });

          if (!upstream.ok || !upstream.body) {
            const text = await upstream.text().catch(() => '');
            lastErrText = text || `status ${upstream.status}`;

            const creditErr =
              upstream.status === 402 ||
              /requires more credits|can only afford|payment required/i.test(lastErrText);

            const routingErr =
              upstream.status === 404 ||
              upstream.status === 400 ||
              /not a valid model id|No allowed providers|model not found/i.test(lastErrText);

            if (creditErr) continue; // try smaller max_tokens on same model
            if (routingErr) break;   // try next model

            // Other upstream failures: surface them
            return json({ ok: false, error: 'upstream_failed', model, detail: lastErrText });
          }

          // Stream SSE (from OpenRouter) → plain text to client
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

                // Close on sentinel
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
                  // ignore keep-alives / partials / non-JSON lines
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
              'x-agent-model': model,
              'x-agent-max-tokens': String(maxTokens),
            },
          });
        } catch (e) {
          lastErrText = String((e as Error)?.message || e);
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
  } catch (e) {
    return json({ ok: false, error: 'agent_error', detail: String((e as Error)?.message || e) });
  }
}
