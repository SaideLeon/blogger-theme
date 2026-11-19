const INI = "/* ===== IDENTIDADE VISUAL (kit) ===== */";
const FIM = "/* ===== FIM DA IDENTIDADE ===== */";

/** O bloco de CSS que muda de marca para marca (≈13 KB), sem o resto dos 150 KB do tema. */
export function identityBlock(xml: string): string {
  const s = xml.indexOf(INI);
  const e = xml.indexOf(FIM);
  return s >= 0 && e > s ? xml.slice(s + INI.length, e) : "";
}

export type CssRule = { id: number; selector: string; bytes: number; text: string };

/** Parte o CSS em regras de topo ("seletor{...}" ou "@media{...}" inteiro). */
export function parseRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  let depth = 0;
  let start = 0;
  let inComment = false;
  for (let i = 0; i < css.length; i++) {
    const two = css.slice(i, i + 2);
    if (!inComment && two === "/*") { inComment = true; i++; continue; }
    if (inComment) { if (two === "*/") { inComment = false; i++; } continue; }
    const c = css[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const text = css.slice(start, i + 1).trim();
        if (text) rules.push({ id: rules.length, selector: text.slice(0, text.indexOf("{")).trim(), bytes: text.length, text });
        start = i + 1;
      }
    }
  }
  return rules;
}

/** Procura regras cujo seletor ou texto contém a consulta (ex.: ".ai-site-header"). */
export function findRules(css: string, consulta: string, maxChars = 3500): { texto: string; total: number } {
  const q = consulta.toLowerCase();
  const hits = parseRules(css).filter((r) => r.text.toLowerCase().includes(q));
  let out = "";
  for (const r of hits) {
    if (out.length + r.text.length > maxChars) break;
    out += r.text + "\n";
  }
  return { texto: out, total: hits.length };
}

/** Confere chavetas equilibradas num bloco de CSS acrescentado. */
export function cssBalanced(css: string): boolean {
  let d = 0;
  for (const c of css.replace(/\/\*[\s\S]*?\*\//g, "")) {
    if (c === "{") d++;
    if (c === "}") d--;
    if (d < 0) return false;
  }
  return d === 0;
}
