// Pequenos auxiliares que reproduzem o comportamento exacto do Python usado em rebrand.py,
// para que o resultado em TypeScript seja idêntico ao do gerador original.

/** round() do Python: arredonda .5 para o par mais próximo (banker's rounding). */
export function pyRound(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

/** html.escape(s, quote=True) do Python. */
export function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** urllib.parse.quote(s, safe='') do Python (mantém só letras, dígitos e _.-~). */
export function quote(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/** Módulo com resultado sempre positivo, como o % do Python. */
export const mod = (a: number, n: number) => ((a % n) + n) % n;
