"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type State = { spec: any; cssExtra: string; patches: any[] };
type Turn = { role: "user" | "assistant"; content: string };
type Saved = { state: State; undo: State[]; history: Turn[]; summary: string };
type Build = { slug: string; temaFicheiro: string; xml: string; paginas: Record<string, string>; avisos: string[] };
type Tema = { id: string; nome: string; estilo: string; modo: string; preview: string | null; cores: { primary: string; accent: string } | null };

const KEY = "bts:v1";
const SUGESTOES = [
  "Muda o blog para culinária moçambicana, com cores laranja e verde.",
  "Troca o nome para Sabor de Casa e atualiza as categorias.",
  "Deixa o cabeçalho mais compacto no telemóvel.",
];

export default function Home() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [build, setBuild] = useState<Build | null>(null);
  const [aba, setAba] = useState<"paginas" | "ficha" | "tema">("paginas");
  const [pagina, setPagina] = useState("sobre-nos");
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const [tools, setTools] = useState<Record<number, string[]>>({});
  const fim = useRef<HTMLDivElement>(null);

  const reconstruir = useCallback(async (state: State) => {
    const r = await fetch("/api/build", { method: "POST", body: JSON.stringify({ state }) });
    const j = await r.json();
    if (!r.ok) { setErro(j.erro ?? "Erro ao gerar o tema."); return; }
    setBuild(j);
  }, []);

  useEffect(() => {
    (async () => {
      const init = await (await fetch("/api/init")).json();
      setTemas(init.temas);
      let s: Saved | null = null;
      try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { /* ficheiro corrompido: recomeça */ }
      s ??= { state: init.state, undo: [], history: [], summary: "" };
      setSaved(s);
      reconstruir(s.state);
    })();
  }, [reconstruir]);

  useEffect(() => { if (saved) localStorage.setItem(KEY, JSON.stringify(saved)); }, [saved]);
  useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [saved?.history.length, busy]);

  async function enviar(msg: string) {
    if (!saved || !msg.trim() || busy) return;
    setBusy(true); setErro(""); setTexto("");
    try {
      const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ ...saved, message: msg }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro ?? "Erro no modelo.");
      setTools((t) => ({ ...t, [j.history.length - 1]: j.chamadas }));
      setSaved({ state: j.state, undo: j.undo, history: j.history, summary: j.summary });
      await reconstruir(j.state);
    } catch (e: any) { setErro(e.message); } finally { setBusy(false); }
  }

  async function mudarTema(t: Tema) {
    if (!saved) return;
    const spec = t.modo === "gerar" ? { ...saved.state.spec, tema: "gerar", colors: t.cores } : { ...saved.state.spec, tema: t.id };
    const state = { ...saved.state, spec };
    setSaved({ ...saved, state, undo: [...saved.undo, saved.state].slice(-10) });
    await reconstruir(state);
  }

  async function desfazer() {
    if (!saved || !saved.undo.length) return;
    const state = saved.undo[saved.undo.length - 1];
    setSaved({ ...saved, state, undo: saved.undo.slice(0, -1) });
    await reconstruir(state);
  }

  async function descarregar() {
    if (!build) return;
    const { default: JSZip } = await import("jszip");
    const z = new JSZip();
    z.file(build.temaFicheiro, build.xml);
    for (const [n, h] of Object.entries(build.paginas)) z.file(`paginas/${n}.html`, h);
    const url = URL.createObjectURL(await z.generateAsync({ type: "blob" }));
    Object.assign(document.createElement("a"), { href: url, download: `${build.slug}.zip` }).click();
    URL.revokeObjectURL(url);
  }

  if (!saved) return <div className="app"><p className="empty">A carregar…</p></div>;
  const { spec } = saved.state;

  return (
    <div className="app">
      <div className="top"><h1>Estúdio de Temas</h1><small>Blogger · conversa → tema XML + 6 páginas</small></div>
      <div className="grid">
        <section className="panel" aria-label="Conversa">
          <header>
            <strong>Conversa</strong>
            <button className="btn" style={{ marginLeft: "auto" }} onClick={desfazer} disabled={busy || !saved.undo.length}>Desfazer</button>
          </header>
          <div className="msgs">
            {!saved.history.length && (
              <div className="empty">Peça uma alteração ao tema. Por exemplo:
                {SUGESTOES.map((s) => <button key={s} className="btn" onClick={() => enviar(s)}>{s}</button>)}
              </div>
            )}
            {saved.history.map((t, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className={`msg ${t.role}`}>{t.content}</div>
                {tools[i]?.length ? <div className="tools">ferramentas: {tools[i].join(", ")}</div> : null}
              </div>
            ))}
            {busy && <div className="tools">a trabalhar…</div>}
            <div ref={fim} />
          </div>
          {erro && <div className="err" role="alert">{erro}</div>}
          <form className="send" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Descreva a alteração…" rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(texto); } }} />
            <button className="btn primary" disabled={busy || !texto.trim()}>Enviar</button>
          </form>
        </section>

        <section className="panel" aria-label="Resultado">
          <header>
            <div className="tabs" role="tablist">
              {([["paginas", "Páginas"], ["ficha", "Ficha"], ["tema", "Tema base"]] as const).map(([k, n]) => (
                <button key={k} role="tab" aria-selected={aba === k} className="tab" onClick={() => setAba(k)}>{n}</button>
              ))}
            </div>
            <button className="btn primary" onClick={descarregar} disabled={!build}>Descarregar ZIP</button>
          </header>
          <div className="body">
            {aba === "paginas" && build && (
              <>
                <select value={pagina} onChange={(e) => setPagina(e.target.value)} style={{ marginBottom: 8 }}>
                  {Object.keys(build.paginas).map((p) => <option key={p}>{p}</option>)}
                </select>
                <iframe title={pagina} sandbox="" srcDoc={build.paginas[pagina] ?? build.paginas[Object.keys(build.paginas)[0]]} />
              </>
            )}
            {aba === "ficha" && (
              <>
                <div className="sw"><i style={{ background: spec.colors.primary }} /><i style={{ background: spec.colors.accent }} />
                  <span>{spec.blog_name} · {spec.domain}</span></div>
                <pre>{JSON.stringify(spec, null, 1)}</pre>
                {saved.state.cssExtra && <><p className="warn">CSS extra</p><pre>{saved.state.cssExtra}</pre></>}
              </>
            )}
            {aba === "tema" && (
              <div className="pick">
                {temas.map((t) => (
                  <button key={t.id} aria-pressed={t.modo === "gerar" ? spec.tema === "gerar" && spec.colors.primary === t.cores?.primary : spec.tema === t.id}
                    onClick={() => mudarTema(t)}>
                    {t.preview && <img src={`/previews/${t.preview.split("/").pop()}`} alt={t.nome} />}
                    <strong>{t.nome}</strong><br /><small>{t.estilo}</small>
                  </button>
                ))}
              </div>
            )}
            {build?.avisos.length ? <p className="warn">{build.avisos.join(" · ")}</p> : null}
            {build && <p className="warn">{build.temaFicheiro} · {Math.round(build.xml.length / 1024)} KB — instale em Blogger → Tema → Restaurar.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
