import { NextResponse } from "next/server";
import { z } from "zod";
import { runTurn } from "@/lib/agent/agent";
import { Patch, Spec } from "@/lib/generator/spec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const State = z.object({ spec: Spec, cssExtra: z.string(), patches: z.array(Patch) });
const Body = z.object({
  state: State,
  undo: z.array(State).max(10),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(200),
  summary: z.string().max(4000),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  try {
    const out = await runTurn(Body.parse(await req.json()));
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ erro: String(e?.message ?? e).slice(0, 600) }, { status: 500 });
  }
}
