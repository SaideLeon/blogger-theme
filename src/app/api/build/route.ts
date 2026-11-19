import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAll } from "@/lib/generator/build";
import { Patch, Spec } from "@/lib/generator/spec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ state: z.object({ spec: Spec, cssExtra: z.string(), patches: z.array(Patch) }) });

export async function POST(req: Request) {
  try {
    const { state } = Body.parse(await req.json());
    const r = await buildAll(state);
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ erro: String(e?.message ?? e).slice(0, 600) }, { status: 400 });
  }
}
