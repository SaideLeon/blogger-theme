import fs from "node:fs";
import path from "node:path";

/** Pasta com os modelos, o catálogo e os textos de nicho (copiados da skill). */
export const KIT = path.join(process.cwd(), "kit");

export const readKit = (...p: string[]) => fs.readFileSync(path.join(KIT, ...p), "utf-8");
export const readKitJson = <T = any>(...p: string[]): T => JSON.parse(readKit(...p));

export type TemaCatalogo = {
  id: string;
  nome: string;
  estilo: string;
  ideal_para: string[];
  modo: "gerar" | "pronto";
  ficheiro?: string;
  config_exemplo: string;
  preview: string | null;
  personalizar?: {
    textos?: Record<string, string>;
    imagens?: Record<string, { var: string; size: [number, number] }>;
    extras?: Record<string, { old: string; new: string }>;
  };
};

export const catalogo = (): TemaCatalogo[] => readKitJson("temas", "catalogo.json").temas;
