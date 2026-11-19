import path from "node:path";
import { NextResponse } from "next/server";
import { catalogo, readKitJson } from "@/lib/generator/kit";
import { Spec } from "@/lib/generator/spec";

export const runtime = "nodejs";

export async function GET() {
  const spec = Spec.parse({ ...readKitJson<Record<string, unknown>>("exemplos", "config-saude-mulher.json"), tema: "gerar" });
  return NextResponse.json({
    state: { spec, cssExtra: "", patches: [] },
    temas: catalogo().map((t) => ({
      id: t.id, nome: t.nome, estilo: t.estilo, ideal_para: t.ideal_para, modo: t.modo, preview: t.preview,
      // os temas "gerar" diferem nas cores; ao escolhê-los aplicam-se as cores do exemplo
      cores: t.modo === "gerar" ? readKitJson<any>("exemplos", path.basename(t.config_exemplo)).colors : null,
    })),
  });
}
