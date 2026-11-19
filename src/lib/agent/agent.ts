import { chat, type Msg } from "./llm";
import { buildParts, compact, type Turn } from "./context";
import { TOOLS, runTool, type Session } from "./tools";
import type { ThemeState } from "../generator/spec";

export type AgentIn = { state: ThemeState; undo: ThemeState[]; history: Turn[]; summary: string; message: string };
export type AgentOut = { reply: string; state: ThemeState; undo: ThemeState[]; history: Turn[]; summary: string; chamadas: string[] };

const MAX_PASSOS = 8;

export async function runTurn(inp: AgentIn): Promise<AgentOut> {
  const session: Session = { state: structuredClone(inp.state), undo: structuredClone(inp.undo) };
  const chamadas: string[] = [];
  // o estado muda durante o turno: a mensagem de estado é reconstruída a cada passo
  const trabalho: Msg[] = buildParts(session.state, inp.summary, inp.history, inp.message).rest;
  let reply = "";

  for (let passo = 0; passo < MAX_PASSOS; passo++) {
    const { head } = buildParts(session.state, inp.summary, [], ""); // instruções + estado novo + resumo
    const msg = await chat([...head, ...trabalho], TOOLS);
    trabalho.push(msg);
    if (!msg.tool_calls?.length) { reply = (msg.content ?? "").trim(); break; }
    for (const c of msg.tool_calls) {
      let args: any = {};
      try { args = JSON.parse(c.function.arguments || "{}"); } catch { /* o modelo recebe o erro abaixo */ }
      chamadas.push(c.function.name);
      trabalho.push({ role: "tool", tool_call_id: c.id, content: await runTool(c.function.name, args, session) });
    }
    if (passo === MAX_PASSOS - 1) reply = "Fiz as alterações possíveis neste pedido; diga se quer continuar.";
  }

  const history: Turn[] = [...inp.history, { role: "user", content: inp.message }, { role: "assistant", content: reply || "(sem resposta)" }];
  const c = await compact(inp.summary, history);
  return { reply, state: session.state, undo: session.undo, history: c.history, summary: c.summary, chamadas };
}
