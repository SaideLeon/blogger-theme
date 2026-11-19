import { mod, pyRound } from "./pyutil";
import K from "../../../kit/constantes.json";

// ---------- colorsys (Python) ----------
function rgbToHls(r: number, g: number, b: number): [number, number, number] {
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const sumc = maxc + minc;
  const rangec = maxc - minc;
  const l = sumc / 2;
  if (minc === maxc) return [0, l, 0];
  const s = l <= 0.5 ? rangec / sumc : rangec / (2 - maxc - minc);
  const rc = (maxc - r) / rangec;
  const gc = (maxc - g) / rangec;
  const bc = (maxc - b) / rangec;
  let h: number;
  if (r === maxc) h = bc - gc;
  else if (g === maxc) h = 2 + rc - bc;
  else h = 4 + gc - rc;
  return [mod(h / 6, 1), l, s];
}

function v(m1: number, m2: number, hue: number): number {
  hue = mod(hue, 1);
  if (hue < 1 / 6) return m1 + (m2 - m1) * hue * 6;
  if (hue < 0.5) return m2;
  if (hue < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - hue) * 6;
  return m1;
}

function hlsToRgb(h: number, l: number, s: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s;
  const m1 = 2 * l - m2;
  return [v(m1, m2, h + 1 / 3), v(m1, m2, h), v(m1, m2, h - 1 / 3)];
}

// ---------- rotação de matiz ----------
export function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return rgbToHls(r, g, b)[0] * 360;
}

function shiftColor(r: number, g: number, b: number, sp: number, sa: number): [number, number, number] {
  const [h, l, s] = rgbToHls(r / 255, g / 255, b / 255);
  if (s < 0.08) return [r, g, b];
  const hd = h * 360;
  const nh = mod(hd + (hd >= 170 && hd <= 201 ? sa : sp), 360);
  const [nr, ng, nb] = hlsToRgb(nh / 360, l, s);
  return [pyRound(nr * 255), pyRound(ng * 255), pyRound(nb * 255)];
}

/**
 * Roda o matiz de todas as cores do texto (hex #rrggbb e rgb/rgba) do azul do tema-base
 * para as cores novas. Brilho e saturação mantêm-se.
 */
export function recolor(text: string, primary: string, accent: string): string {
  const sp = hue(primary) - hue(K.SRC_PRIMARY);
  const sa = hue(accent) - hue(K.SRC_ACCENT);
  if (Math.abs(sp) < 0.5 && Math.abs(sa) < 0.5) return text;
  text = text.replace(/#([0-9a-fA-F]{6})\b/g, (_m, c: string) => {
    const [r, g, b] = shiftColor(parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16), sp, sa);
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  });
  return text.replace(/(rgba?)\((\d+),\s*(\d+),\s*(\d+)/g, (_m, fn: string, r: string, g: string, b: string) => {
    const [nr, ng, nb] = shiftColor(+r, +g, +b, sp, sa);
    return `${fn}(${nr},${ng},${nb}`;
  });
}
