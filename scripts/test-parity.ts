// Compara o gerador em TypeScript com a saída do rebrand.py original (byte a byte).
import fs from "node:fs";
import path from "node:path";
import { buildAll } from "../src/lib/generator/build";
import { Spec } from "../src/lib/generator/spec";

const base = path.join(process.cwd(), "scripts", "baseline");
let falhas = 0;

async function main() {
for (const nome of ["saude-mulher", "artificializado"]) {
  const cfg = JSON.parse(fs.readFileSync(path.join(base, `cfg-${nome}.json`), "utf-8"));
  const spec = Spec.parse({ ...cfg, tema: "gerar" });
  const r = await buildAll({ spec, cssExtra: "", patches: [] }, {}, new Date(2026, 10, 18));
  const dir = path.join(base, `out-${nome}`);
  const esperado = fs.readFileSync(path.join(dir, r.temaFicheiro), "utf-8");
  const ok = (a: string, b: string, n: string) => {
    if (a === b) return console.log("  ok  ", n);
    falhas++;
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    console.log("  FALHA", n, "difere na posição", i, "\n    ts :", JSON.stringify(a.slice(i - 30, i + 60)), "\n    py :", JSON.stringify(b.slice(i - 30, i + 60)));
  };
  console.log(nome);
  ok(r.xml, esperado, r.temaFicheiro);
  for (const [p, html] of Object.entries(r.paginas)) ok(html, fs.readFileSync(path.join(dir, "paginas", p + ".html"), "utf-8"), p + ".html");
}
console.log(falhas ? `\n${falhas} diferença(s)` : "\nTudo idêntico ao Python ✔");
process.exit(falhas ? 1 : 0);
}
main();
