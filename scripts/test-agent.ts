// Testa o ciclo do agente contra o servidor falso (LLM_BASE_URL=http://localhost:8787).
import { runTurn } from "../src/lib/agent/agent";
import { buildAll } from "../src/lib/generator/build";
import { Spec } from "../src/lib/generator/spec";
import fs from "node:fs";

async function main() {
  const cfg = JSON.parse(fs.readFileSync("scripts/baseline/cfg-saude-mulher.json", "utf-8"));
  const state = { spec: Spec.parse({ ...cfg, tema: "gerar" }), cssExtra: "", patches: [] };
  const a = await runTurn({ state, undo: [], history: [], summary: "", message: "Muda para culinária" });
  console.log("turno 1:", a.reply, "| ferramentas:", a.chamadas.join(","), "| nome:", a.state.spec.blog_name, a.state.spec.colors);
  const b = await runTurn({ state: a.state, undo: a.undo, history: a.history, summary: a.summary, message: "Deixa o cabeçalho compacto" });
  console.log("turno 2:", b.reply, "| ferramentas:", b.chamadas.join(","), "| css_extra:", JSON.stringify(b.state.cssExtra));
  const r = await buildAll(b.state, {}, new Date(2026, 10, 18));
  console.log("tema final:", r.temaFicheiro, Math.round(r.xml.length / 1024) + " KB", "| ajustes no XML:", r.xml.includes("AJUSTES DO UTILIZADOR"), "| avisos:", r.avisos);
  // erro de validação deve voltar ao modelo, sem rebentar
  const bad = await (await import("../src/lib/agent/tools")).runTool("atualizar_ficha", { alteracoes: { colors: { primary: "vermelho" } } }, { state: b.state, undo: [] });
  console.log("validação:", bad);
  // remendo: ambíguo é recusado, único é aceite; widget é recusado
  const T = await import("../src/lib/agent/tools");
  const s = { state: b.state, undo: [] as any[] };
  console.log("remendo ambíguo:", await T.runTool("remendar", { alvo: "tema", antigo: "<div", novo: "<div" }, s));
  console.log("remendo widget:", await T.runTool("remendar", { alvo: "tema", antigo: "<b:widget", novo: "<b:widget" }, s));
  console.log("desfazer:", await T.runTool("desfazer", {}, { state: b.state, undo: b.undo }));
  // tema pronto
  const p = { ...b.state, spec: { ...b.state.spec, tema: "contabilidade-em-foco" as const, pronto: { nome: "Contas Claras" } } };
  const rp = await buildAll(p, {}, new Date(2026, 10, 18));
  console.log("pronto:", rp.temaFicheiro, Math.round(rp.xml.length / 1024) + " KB", rp.avisos);
}
main().catch((e) => { console.error("ERRO", e); process.exit(1); });
