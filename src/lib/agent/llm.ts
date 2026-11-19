// Cliente mínimo para qualquer servidor compatível com a API "chat completions" da OpenAI
// (OpenRouter, Groq, Together, Fireworks, Cerebras, Ollama, vLLM...). Sem dependências.

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type Msg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};
export type ToolDef = { type: "function"; function: { name: string; description: string; parameters: object } };

export const estTokens = (s: string) => Math.ceil(s.length / 3.5);

export async function chat(messages: Msg[], tools?: ToolDef[]): Promise<Msg> {
  const base = (process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const key = process.env.LLM_API_KEY;
  const local = /^http:\/\/(localhost|127\.0\.0\.1)/.test(base);
  if (!key && !local) throw new Error("Falta LLM_API_KEY no ficheiro .env.local (veja .env.example).");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || "openai/gpt-oss-120b",
      messages,
      ...(tools?.length ? { tools, tool_choice: "auto" } : {}),
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(110_000),
  });
  if (!res.ok) throw new Error(`Modelo respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const m = data.choices?.[0]?.message;
  if (!m) throw new Error("Resposta do modelo sem mensagem.");
  return { role: "assistant", content: m.content ?? null, tool_calls: m.tool_calls?.length ? m.tool_calls : undefined };
}
