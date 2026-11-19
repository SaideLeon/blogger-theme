import fs from "node:fs";
import path from "node:path";
import K from "../../../kit/constantes.json";
import { recolor } from "./color";
import { esc, quote } from "./pyutil";
import { KIT, catalogo, readKit, readKitJson } from "./kit";
import { bannerDataUrl, coverDataUrl, logoDataUrl } from "./images";
import { applyPatches } from "./patches";
import { validateXml } from "./validate";
import type { Assets, Spec, ThemeState } from "./spec";

const INI = "/* ===== IDENTIDADE VISUAL (kit) ===== */";
const FIM = "/* ===== FIM DA IDENTIDADE ===== */";
const ICONS = K.ICONS as Record<string, string>;

const svgX = (k: string) => `<svg class='ai-ico' viewBox='0 0 24 24' aria-hidden='true'>${ICONS[k]}</svg>`;
const svgH = (k: string) => ICONS[k].replace(/'/g, '"');

export type BuildResult = {
  slug: string;
  temaFicheiro: string;
  xml: string;
  paginas: Record<string, string>; // "sobre-nos" -> html
  avisos: string[];
};

// ---------- seletor de idiomas (GTranslate) ----------
function gtTokens(spec: Spec) {
  const i = spec.idiomas ?? { ativo: true, padrao: "pt" };
  if (i.ativo === false) return { GT_CSS: "", GT_HTML: "", GT_SCRIPT: "" };
  const { primary, accent } = spec.colors;
  const st = {
    default_language: i.padrao ?? "pt",
    languages: (i as any).lista ?? K.GT_LANGS,
    wrapper_selector: ".gtranslate_wrapper",
    native_language_names: false,
    flag_size: 24,
    ...K.GT_COLORS,
  };
  // json.dumps do Python usa ", " e ": " como separadores; reproduzimos para ficar idêntico
  const js = recolor(pyJson(st), primary, accent);
  const script =
    "    <script>window.gtranslateSettings = " + js + ";</script>\n" +
    "    <script defer='defer' src='https://cdn.gtranslate.net/widgets/latest/dwf.js'></script>\n";
  return { GT_CSS: recolor(K.GT_CSS, primary, accent), GT_HTML: K.GT_HTML, GT_SCRIPT: script };
}

/** json.dumps(obj, ensure_ascii=False) do Python. */
function pyJson(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(pyJson).join(", ") + "]";
  if (v && typeof v === "object")
    return "{" + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + pyJson(x)).join(", ") + "}";
  return JSON.stringify(v);
}

// ---------- imagens ----------
async function logoCss(spec: Spec, assets: Assets): Promise<string> {
  if (assets.logo) return `url('${await logoDataUrl(assets.logo)}')`;
  const { primary, accent } = spec.colors;
  const ini = esc((spec.blog_name.trim() || "B")[0].toUpperCase());
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${accent}'/><stop offset='1' stop-color='${primary}'/></linearGradient></defs>` +
    `<path d='M50 6 90 20v28c0 24-17 40-40 46C27 88 10 72 10 48V20z' fill='url(#g)'/>` +
    `<text x='50' y='65' font-family='Arial,sans-serif' font-size='46' font-weight='700' text-anchor='middle' fill='white'>${ini}</text></svg>`;
  return `url('data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}')`;
}
async function bannerCss(assets: Assets): Promise<string> {
  return assets.banner ? `url('${await bannerDataUrl(assets.banner)}')` : "none";
}

// ---------- marcadores ----------
export function buildTokens(spec: Spec, today = new Date()): Record<string, string> {
  const niche = readKitJson("niches.json")[spec.niche];
  const name = spec.blog_name;
  const n = spec.name_accent_chars;
  const nameHtml = n > 0 && n < name.length ? `${esc(name.slice(0, -n))}<span>${esc(name.slice(-n))}</span>` : esc(name);
  const tag = spec.tagline.map((t) => t.toUpperCase());
  const cats = spec.categorias;
  const enc = quote;
  const nav = cats.map((c) => `<a href='/search/label/${enc(c.label)}'>${svgX(c.icone)}${esc(c.menu || c.nome)}</a>`).join("\n          ");
  const cards = cats
    .map(
      (c) =>
        `<a class='ai-category' href='/search/label/${enc(c.label)}'><span class='ai-category-icon'>${svgX(c.icone)}</span>` +
        `<span><strong>${esc(c.nome)}</strong><small>${esc(c.descricao)}</small></span>` +
        `<span class='ai-category-arrow'>${svgX("chev")}</span></a>`
    )
    .join("\n                ");
  const temas = cats
    .map(
      (c) =>
        `<a class="tema" href="/search/label/${enc(c.label)}">\n      <span class="tema-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${svgH(c.icone)}</svg></span>\n` +
        `      <span><h3>${esc(c.nome)}</h3><p>${esc(c.sobre)}</p></span>\n    </a>`
    )
    .join("\n    ");
  const valores = spec.sobre.valores.map((v) => `<div class="valor"><h3>${esc(v.titulo)}</h3><p>${esc(v.texto)}</p></div>`).join("\n    ");
  const quem = spec.sobre.quem_somos.map((p) => `<p>${p}</p>`).join("\n  ");
  const data = spec.date || `${today.getDate()} de ${K.MESES[today.getMonth()]} de ${today.getFullYear()}`;
  const hb = spec.hero_buttons;
  return {
    BLOG_NAME: esc(name), BLOG_DOMAIN: esc(spec.domain), NAME_HTML: nameHtml,
    TAGLINE_UPPER_X: tag.map(esc).join(" &#8226; "), TAGLINE_UPPER_H: tag.map(esc).join(" &bull; "),
    EMAIL: esc(spec.email), WHATSAPP: (spec.whatsapp ?? "").replace(/\D/g, ""), DATA: esc(data), TOPICS: spec.topics,
    FOOTER_NOTE: esc(spec.footer_note ?? ""),
    HERO_LEAD_HTML: spec.hero_lead_html, HERO_BTN1: esc(hb.primary), HERO_BTN2: esc(hb.secondary), HERO_BTN2_LABEL_ENC: enc(hb.secondary_label),
    NAV_CATEGORIES: nav, CATEGORY_CARDS: cards,
    SOBRE_INTRO_HTML: spec.sobre.intro_html, SOBRE_QUEM_SOMOS_HTML: quem, SOBRE_TEMAS_HTML: temas, VALORES_HTML: valores,
    CONTACTO_INTRO_HTML: spec.contacto_intro_html,
    TERMOS_RESUMO_HTML: niche.termos_resumo_html, TERMOS_NICHO_HTML: niche.termos_nicho_html,
    LIMITACAO_ITENS: niche.limitacao_itens, ATUALIDADE: niche.atualidade, AVISO_PROF: niche.aviso_prof,
    AVISO_CARTAO_NICHO: niche.aviso_cartao_nicho, AVISO_NICHO_HTML: niche.aviso_nicho_html,
  };
}

const render = (text: string, tok: Record<string, string>) =>
  text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => (k in tok ? tok[k] : m));

function assertNoLeft(text: string, onde: string) {
  const left = [...new Set(text.match(/\{\{\w+\}\}/g) ?? [])];
  if (left.length) throw new Error(`Marcadores por preencher em ${onde}: ${left.join(", ")}`);
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "blog";

// ---------- tema gerado (Artificializado / Mãe em Flor) ----------
async function buildGerado(state: ThemeState, assets: Assets, tok: Record<string, string>) {
  const { spec, cssExtra } = state;
  const { primary, accent } = spec.colors;
  let x = readKit("templates", "tema.xml.tpl");
  const s = x.indexOf(INI);
  const e = x.indexOf(FIM);
  const extra = cssExtra.trim() ? `\n/* ===== AJUSTES DO UTILIZADOR ===== */\n${cssExtra.trim()}\n` : "";
  x = x.slice(0, s) + recolor(x.slice(s, e), primary, accent) + extra + x.slice(e);
  const tokX = { ...tok, ...gtTokens(spec), LOGO_CSS: await logoCss(spec, assets), BANNER_CSS: await bannerCss(assets) };
  x = render(x, tokX);
  assertNoLeft(x, "tema");
  return x;
}

// ---------- temas prontos (Contabilidade em Foco / MundoNotícias) ----------
const escXml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function buildPronto(state: ThemeState, assets: Assets, avisos: string[]) {
  const id = state.spec.tema;
  const t = catalogo().find((c) => c.id === id);
  if (!t || !t.personalizar) throw new Error(`Tema pronto desconhecido: ${id}`);
  let x = fs.readFileSync(path.join(KIT, "temas", path.basename(t.ficheiro!)), "utf-8");
  const p = state.spec.pronto ?? {};
  const cfg = t.personalizar;
  for (const [k, old] of Object.entries(cfg.textos ?? {})) {
    const v = (p as any)[k] as string | undefined;
    if (!v) continue;
    if (!x.includes(old)) avisos.push(`'${old}' não existe no tema; "${k}" ignorado.`);
    x = x.split(old).join(escXml(v));
  }
  for (const [k, spec] of Object.entries(cfg.imagens ?? {})) {
    const buf = (assets as any)[k] as Buffer | undefined;
    if (!buf) continue;
    const uri = await coverDataUrl(buf, spec.size);
    const re = new RegExp(`(--${spec.var}:url\\(')data:image/[a-z]+;base64,[A-Za-z0-9+/=]+('\\))`);
    if (!re.test(x)) throw new Error(`Não encontrei --${spec.var} no tema.`);
    x = x.replace(re, (_m, a: string, b: string) => a + uri + b);
  }
  for (const [k, spec] of Object.entries(cfg.extras ?? {})) {
    const v = (p as any)[k] as string | undefined;
    if (!v) continue;
    if (!x.includes(spec.old)) throw new Error(`Ponto de inserção de "${k}" não encontrado.`);
    x = x.replace(spec.old, () => spec.new.replace("{v}", v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")));
  }
  return x;
}

// ---------- páginas legais ----------
export function buildPaginas(state: ThemeState, today = new Date()): Record<string, string> {
  const { primary, accent } = state.spec.colors;
  const tok = buildTokens(state.spec, today);
  const out: Record<string, string> = {};
  const dir = path.join(KIT, "templates");
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".html.tpl")).sort()) {
    let t = fs.readFileSync(path.join(dir, f), "utf-8");
    t = t.replace(/<style>[\s\S]*?<\/style>/g, (m) => recolor(m, primary, accent));
    t = render(t, tok);
    assertNoLeft(t, f);
    out[f.replace(/\.html\.tpl$/, "")] = t;
  }
  return out;
}

// ---------- ponto de entrada ----------
export async function buildAll(state: ThemeState, assets: Assets = {}, today = new Date()): Promise<BuildResult> {
  const avisos: string[] = [];
  const tok = buildTokens(state.spec, today);
  const slug = slugify(state.spec.tema === "gerar" ? state.spec.blog_name : state.spec.tema);
  let xml = state.spec.tema === "gerar" ? await buildGerado(state, assets, tok) : await buildPronto(state, assets, avisos);

  const pt = applyPatches(xml, state.patches, "tema");
  xml = pt.text;
  avisos.push(...pt.warnings);
  const erro = validateXml(xml);
  if (erro) throw new Error("O XML do tema ficou inválido: " + erro);

  let paginas = buildPaginas(state, today);
  for (const nome of Object.keys(paginas)) {
    const r = applyPatches(paginas[nome], state.patches, nome);
    paginas[nome] = r.text;
    avisos.push(...r.warnings);
  }
  if (state.spec.tema !== "gerar" && state.spec.pronto?.nome === undefined && state.spec.blog_name) {
    // nada: os temas prontos mantêm o nome embutido no banner
  }
  return { slug, temaFicheiro: `tema-${slug}.xml`, xml, paginas, avisos };
}
