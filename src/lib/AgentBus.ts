export const AGENT_OPEN_EVENT = 'sui-agent:open';

export function openAgentWithPrompt(prompt?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AGENT_OPEN_EVENT, { detail: { prompt: prompt ?? '' } }));
}
