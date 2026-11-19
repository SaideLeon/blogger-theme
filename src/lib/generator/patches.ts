import type { Patch } from "./spec";

// Regra da skill: nunca mexer nas estruturas do Blogger.
const PROIBIDO = /<\/?b:(widget|section|includable|skin|template-skin)\b/;

export function applyPatches(text: string, patches: Patch[], alvo: string): { text: string; warnings: string[] } {
  const warnings: string[] = [];
  for (const p of patches) {
    if (p.alvo.replace(/\.html$/, "") !== alvo) continue;
    if (alvo === "tema" && (PROIBIDO.test(p.antigo) || PROIBIDO.test(p.novo))) {
      warnings.push(`Remendo ignorado: não se pode alterar widgets/secções do Blogger ("${p.antigo.slice(0, 40)}…").`);
      continue;
    }
    const n = text.split(p.antigo).length - 1;
    if (n !== 1) {
      warnings.push(`Remendo ignorado: o texto "${p.antigo.slice(0, 40)}…" aparece ${n} vezes (tem de ser exactamente 1).`);
      continue;
    }
    text = text.replace(p.antigo, () => p.novo); // função evita interpretar "$&" no texto novo
  }
  return { text, warnings };
}
