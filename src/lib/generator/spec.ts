import { z } from "zod";
import K from "../../../kit/constantes.json";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "cor no formato #rrggbb");
const icones = Object.keys(K.ICONS) as [string, ...string[]];

export const Categoria = z.object({
  nome: z.string().min(1),
  menu: z.string().optional(),
  label: z.string().min(1), // etiqueta EXACTA do Blogger (/search/label/<label>)
  icone: z.enum(icones),
  descricao: z.string().min(1),
  sobre: z.string().min(1),
});

/** A "ficha" do blog: tudo o que o modelo precisa de editar (≈1–2 mil tokens). */
export const Spec = z.object({
  tema: z.enum(["gerar", "contabilidade-em-foco", "mundo-noticias"]).default("gerar"),
  blog_name: z.string().min(1),
  name_accent_chars: z.number().int().min(0).max(8).default(2),
  domain: z.string().min(1),
  tagline: z.tuple([z.string(), z.string(), z.string()]),
  topics: z.string().min(1),
  niche: z.enum(["tech", "saude", "generico"]).default("generico"),
  colors: z.object({ primary: hex, accent: hex }),
  email: z.string().min(3),
  whatsapp: z.string().optional().default(""),
  date: z.string().nullable().optional(),
  footer_note: z.string().optional().default(""),
  hero_lead_html: z.string().min(1),
  hero_buttons: z.object({ primary: z.string(), secondary: z.string(), secondary_label: z.string() }),
  categorias: z.array(Categoria).length(4),
  sobre: z.object({
    intro_html: z.string(),
    quem_somos: z.array(z.string()).min(1),
    valores: z.array(z.object({ titulo: z.string(), texto: z.string() })).min(1),
  }),
  contacto_intro_html: z.string(),
  idiomas: z
    .object({ ativo: z.boolean().default(true), padrao: z.string().default("pt"), lista: z.array(z.string()).optional() })
    .optional(),
  /** Só para temas prontos (contabilidade-em-foco / mundo-noticias). */
  pronto: z
    .object({
      nome: z.string().optional(),
      lema: z.string().optional(),
      lema3: z.string().optional(),
      email: z.string().optional(),
      newsletter: z.string().optional(),
    })
    .optional(),
});
export type Spec = z.infer<typeof Spec>;

/** Imagens enviadas pelo utilizador. Ficam FORA da ficha (nunca vão ao modelo). */
export type Assets = { logo?: Buffer; banner?: Buffer; hero?: Buffer };

/** Remendo: troca exacta de texto aplicada ao resultado gerado. */
export const Patch = z.object({
  alvo: z.string(), // "tema" ou nome da página (ex.: "sobre-nos")
  antigo: z.string().min(1),
  novo: z.string(),
  motivo: z.string().optional(),
});
export type Patch = z.infer<typeof Patch>;

/** Tudo o que define o tema de um utilizador. É pequeno e fica na base de dados. */
export type ThemeState = { spec: Spec; cssExtra: string; patches: Patch[] };
