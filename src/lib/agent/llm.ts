import { Groq } from "groq-sdk";

// Cliente para Groq (via groq-sdk) com fallback para qualquer servidor compatível com a API OpenAI
// quando LLM_BASE_URL está definido (ex.: mock local em testes ou OpenRouter/Ollama/vLLM).

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
  const customBase = process.env.LLM_BASE_URL?.trim().replace(/\/$/, "");
  const isCustomOpenAI = Boolean(customBase && !/api\.groq\.com/i.test(customBase));
  const key = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "openai/gpt-oss-120b";

  if (isCustomOpenAI && customBase) {
    const local = /^http:\/\/(localhost|127\.0\.0\.1)/.test(customBase);
    if (!key && !local) throw new Error("Falta GROQ_API_KEY ou LLM_API_KEY no ficheiro .env.local (veja .env.example).");
    const res = await fetch(`${customBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({
        model,
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

  if (!key) {
    throw new Error("Falta GROQ_API_KEY (ou LLM_API_KEY) nas variáveis de ambiente / .env.local (veja .env.example).");
  }

  const groq = new Groq({
    apiKey: key,
    ...(customBase ? { baseURL: customBase } : {}),
    timeout: 110_000,
  });

  const completion = await groq.chat.completions.create({
    messages: messages as Groq.Chat.Completions.ChatCompletionMessageParam[],
    model,
    temperature: 1,
    max_completion_tokens: 65536,
    top_p: 1,
    stream: false,
    ...(model.includes("gpt-oss") ? { reasoning_effort: "medium" as const } : {}),
    stop: null,
    ...(tools?.length
      ? {
          tools: tools as Groq.Chat.Completions.ChatCompletionTool[],
          tool_choice: "auto" as const,
        }
      : {}),
  });

  const m = completion.choices?.[0]?.message;
  if (!m) throw new Error("Resposta do modelo sem mensagem.");

  return {
    role: "assistant",
    content: m.content ?? null,
    tool_calls: m.tool_calls?.length
      ? m.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }))
      : undefined,
  };
}
