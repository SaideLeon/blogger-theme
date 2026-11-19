import { chat, estTokens, type Msg } from "./llm";
import { SYSTEM, estadoBlock } from "./prompts";
import type { ThemeState } from "../generator/spec";

export type Turn = { role: "user" | "assistant"; content: string };

export const budget = () => Number(process.env.CONTEXT_BUDGET_TOKENS || 24000);

/**
 * Monta o contexto de um pedido em camadas, da mais estável para a mais volátil:
 * 1) instruções fixas  2) estado actual (ficha + CSS + remendos)  3) resumo do que já passou
 * 4) últimas mensagens que couberem no orçamento  5) pedido novo.
 */
export function buildParts(st: ThemeState, summary: string, history: Turn[], user: string): { head: Msg[]; rest: Msg[] } {
  const head: Msg[] = [
    { role: "system", content: SYSTEM },
    { role: "system", content: estadoBlock(st) },
    ...(summary ? [{ role: "system" as const, content: `RESUMO DA CONVERSA ANTERIOR: ${summary}` }] : []),
  ];
  let used = head.reduce((n, m) => n + estTokens(m.content ?? ""), 0) + estTokens(user);
  const keep: Turn[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const t = estTokens(history[i].content);
    if (used + t > budget()) break;
    used += t;
    keep.unshift(history[i]);
  }
  return { head, rest: [...keep, { role: "user", content: user }] };
}

/** Quando o histórico passa de 60 % do orçamento, resume a metade mais antiga. */
export async function compact(summary: string, history: Turn[]): Promise<{ summary: string; history: Turn[] }> {
  const total = history.reduce((n, t) => n + estTokens(t.content), 0);
  if (total < budget() * 0.6 || history.length < 4) return { summary, history };
  const cut = Math.floor(history.length / 2);
  const old = history.slice(0, cut);
  try {
    const r = await chat([
      { role: "system", content: "Resume em português, em no máximo 120 palavras, as decisões e preferências do utilizador sobre o seu blog/tema. Só factos úteis para continuar o trabalho." },
      { role: "user", content: `${summary ? "Resumo anterior: " + summary + "\n\n" : ""}Conversa:\n${old.map((t) => `${t.role}: ${t.content}`).join("\n")}` },
    ]);
    return { summary: (r.content ?? summary).trim(), history: history.slice(cut) };
  } catch {
    return { summary, history: history.slice(cut) }; // sem resumo é melhor do que estourar o contexto
  }
}
