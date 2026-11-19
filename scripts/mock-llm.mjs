// Servidor falso compatível com /chat/completions, só para testar o ciclo de ferramentas sem chave.
import http from "node:http";
let n = 0;
http.createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
    const body = JSON.parse(b || "{}");
    const last = body.messages[body.messages.length - 1];
    const call = (name, args) => ({ role: "assistant", content: null, tool_calls: [{ id: "c" + ++n, type: "function", function: { name, arguments: JSON.stringify(args) } }] });
    let message;
    if (last.role === "tool") message = { role: "assistant", content: "Feito: mudei o nome e as cores." };
    else if (/resume/i.test(body.messages[0].content)) message = { role: "assistant", content: "Resumo de teste." };
    else if (/cabeçalho/i.test(last.content)) message = call("acrescentar_css", { css: ".ai-site-header{min-height:48px}", motivo: "compacto" });
    else message = call("atualizar_ficha", { alteracoes: { blog_name: "Sabor de Casa", colors: { primary: "#d9480f", accent: "#2b8a3e" } } });
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ choices: [{ message }], _ctx_msgs: body.messages.length, _ctx_chars: JSON.stringify(body.messages).length }));
  });
}).listen(8787, () => console.log("mock em 8787"));
