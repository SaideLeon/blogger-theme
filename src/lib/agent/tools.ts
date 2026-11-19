import { buildAll } from "../generator/build";
import { cssBalanced, findRules, identityBlock, parseRules } from "../generator/css-rules";
import { applyPatches } from "../generator/patches";
import { Spec, type Patch, type ThemeState } from "../generator/spec";
import type { ToolDef } from "./llm";

export type Session = { state: ThemeState; undo: ThemeState[] };

const MAX_CSS_EXTRA = 8000;
const snap = (s: Session) => {
  s.undo.push(structuredClone(s.state));
  if (s.undo.length > 10) s.undo.shift();
};

function deepMerge(base: any, patch: any): any {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return patch;
  const out = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(patch)) out[k] = deepMerge(out[k], v);
  return out;
}

export const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "atualizar_ficha",
      description:
        "Altera a ficha do blog (nome, cores, textos, categorias, tema base...). Envie só os campos que mudam: objectos são fundidos; listas (categorias, valores, tagline) são substituídas por inteiro.",
      parameters: { type: "object", properties: { alteracoes: { type: "object" } }, required: ["alteracoes"] },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_regras_css",
      description: "Índice das regras de CSS da identidade visual (id, seletor, tamanho). Só para tema 'gerar'. Use antes de ler_regras_css.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "ler_regras_css",
      description: "Devolve o CSS das regras cujo seletor/texto contém a consulta (ex.: '.ai-site-header'). Máx. ~3,5 KB.",
      parameters: { type: "object", properties: { consulta: { type: "string" } }, required: ["consulta"] },
    },
  },
  {
    type: "function",
    function: {
      name: "acrescentar_css",
      description: "Acrescenta CSS ao fim da identidade visual (vence regras anteriores). Use para ajustes visuais. Chavetas equilibradas; máx. 8 KB no total.",
      parameters: { type: "object", properties: { css: { type: "string" }, motivo: { type: "string" } }, required: ["css"] },
    },
  },
  {
    type: "function",
    function: {
      name: "remendar",
      description:
        "Troca exacta de texto no resultado final. 'alvo' é 'tema' ou o nome da página (sobre-nos, contacto, ...). 'antigo' tem de aparecer exactamente 1 vez. Não pode tocar em b:widget/b:section/b:includable.",
      parameters: {
        type: "object",
        properties: { alvo: { type: "string" }, antigo: { type: "string" }, novo: { type: "string" }, motivo: { type: "string" } },
        required: ["alvo", "antigo", "novo"],
      },
    },
  },
  { type: "function", function: { name: "desfazer", description: "Desfaz a última alteração (ficha, CSS ou remendo).", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "validar", description: "Gera o tema e as páginas e devolve tamanho e avisos. Chame no fim de alterações grandes.", parameters: { type: "object", properties: {} } } },
];

export async function runTool(name: string, args: any, s: Session): Promise<string> {
  try {
    switch (name) {
      case "atualizar_ficha": {
        const merged = deepMerge(s.state.spec, args?.alteracoes ?? {});
        const r = Spec.safeParse(merged);
        if (!r.success)
          return JSON.stringify({ ok: false, erros: r.error.issues.slice(0, 6).map((i) => `${i.path.join(".")}: ${i.message}`) });
        snap(s);
        s.state.spec = r.data;
        return JSON.stringify({ ok: true });
      }
      case "listar_regras_css":
      case "ler_regras_css": {
        if (s.state.spec.tema !== "gerar") return JSON.stringify({ ok: false, erro: "Só existe para o tema 'gerar'." });
        const css = identityBlock((await buildAll(s.state)).xml);
        if (name === "listar_regras_css")
          return JSON.stringify(parseRules(css).map((r) => `${r.id}|${r.selector.slice(0, 70)}|${r.bytes}`));
        const { texto, total } = findRules(css, String(args?.consulta ?? ""));
        return JSON.stringify({ regras_encontradas: total, css: texto });
      }
      case "acrescentar_css": {
        const css = String(args?.css ?? "");
        if (!cssBalanced(css)) return JSON.stringify({ ok: false, erro: "Chavetas desequilibradas." });
        if (s.state.cssExtra.length + css.length > MAX_CSS_EXTRA) return JSON.stringify({ ok: false, erro: "Limite de CSS extra atingido; peça para consolidar." });
        snap(s);
        s.state.cssExtra = (s.state.cssExtra + "\n" + css).trim();
        return JSON.stringify({ ok: true, bytes_css_extra: s.state.cssExtra.length });
      }
      case "remendar": {
        const p: Patch = { alvo: String(args?.alvo), antigo: String(args?.antigo), novo: String(args?.novo ?? ""), motivo: args?.motivo };
        const b = await buildAll(s.state);
        const alvo = p.alvo.replace(/\.html$/, "");
        const texto = alvo === "tema" ? b.xml : b.paginas[alvo];
        if (texto === undefined) return JSON.stringify({ ok: false, erro: `Alvo desconhecido: ${p.alvo}. Páginas: ${Object.keys(b.paginas).join(", ")}` });
        const t = applyPatches(texto, [p], alvo);
        if (t.warnings.length) return JSON.stringify({ ok: false, erro: t.warnings[0] });
        snap(s);
        s.state.patches.push(p);
        return JSON.stringify({ ok: true });
      }
      case "desfazer": {
        const prev = s.undo.pop();
        if (!prev) return JSON.stringify({ ok: false, erro: "Nada para desfazer." });
        s.state = prev;
        return JSON.stringify({ ok: true });
      }
      case "validar": {
        const b = await buildAll(s.state);
        return JSON.stringify({ ok: true, tema_kb: Math.round(b.xml.length / 1024), paginas: Object.keys(b.paginas), avisos: b.avisos });
      }
      default:
        return JSON.stringify({ ok: false, erro: `Ferramenta desconhecida: ${name}` });
    }
  } catch (e: any) {
    return JSON.stringify({ ok: false, erro: String(e?.message ?? e).slice(0, 300) });
  }
}
