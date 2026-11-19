<!-- PÁGINA "SOBRE NÓS" - ARTIFICIALIZADO
     Blogger > Páginas > Nova página > mudar para "Vista HTML" > colar tudo > Publicar.
     Endereço recomendado (Ligação permanente personalizada): sobre-nos  -> /p/sobre-nos.html -->
<style>
.ai-sobre{--azul:#087cff;--ciano:#16d7f5;--marinho:#061735;--texto:#435674;--linha:#dce7f8;font-family:inherit;color:var(--texto);line-height:1.7;font-size:16px}
.ai-sobre *{box-sizing:border-box}
.ai-sobre h2{color:#092653;font-size:24px;line-height:1.25;margin:40px 0 14px;font-weight:800}
.ai-sobre p{margin:0 0 14px}
.ai-sobre a{text-decoration:none}

.ai-sobre .intro{display:flex;align-items:center;gap:22px;padding:26px;border-radius:16px;color:#fff;background:linear-gradient(110deg,#061735,#0a3a78);border-bottom:4px solid var(--ciano)}
.ai-sobre .intro-logo{flex:none;width:84px;height:84px;background:var(--ai-logo) center/contain no-repeat}
.ai-sobre .intro-texto{font-size:19px;line-height:1.5;font-weight:600;color:#fff}
.ai-sobre .intro-texto strong{color:var(--ciano)}
.ai-sobre .intro-lema{display:block;margin-top:8px;font-size:12px;font-weight:500;letter-spacing:.2em;color:#c7d8f4}

.ai-sobre .temas{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:18px}
.ai-sobre .tema{display:flex;gap:14px;padding:18px;background:#fff;border:1px solid var(--linha);border-radius:14px;box-shadow:0 5px 18px rgba(13,42,86,.07)}
.ai-sobre .tema-ico{flex:none;width:44px;height:44px;border-radius:12px;background:var(--marinho);color:var(--ciano);display:grid;place-items:center}
.ai-sobre .tema-ico svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ai-sobre .tema h3{margin:0 0 4px;font-size:17px;color:#092653;font-weight:800}
.ai-sobre .tema p{margin:0;font-size:14.5px;line-height:1.55}

.ai-sobre .valores{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
.ai-sobre .valor{padding:20px;border-radius:14px;background:#f3f7ff;border:1px solid var(--linha);border-top:4px solid var(--azul)}
.ai-sobre .valor h3{margin:0 0 6px;font-size:18px;color:#092653;font-weight:800}
.ai-sobre .valor p{margin:0;font-size:14.5px;line-height:1.55}

.ai-sobre .cta{margin-top:40px;padding:26px;border-radius:16px;text-align:center;color:#fff;background:linear-gradient(110deg,#061735,#0a3a78)}
.ai-sobre .cta h2{color:#fff;margin:0 0 8px}
.ai-sobre .cta p{color:#dbe9ff;margin:0 auto 18px;max-width:520px}
.ai-sobre .botoes{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.ai-sobre .btn{display:inline-block;padding:12px 22px;border-radius:28px;font-weight:800;font-size:14px;background:var(--azul);color:#fff!important}
.ai-sobre .btn.sec{background:transparent;border:1px solid #d4eaff}

@media(max-width:640px){
 .ai-sobre .intro{flex-direction:column;text-align:center;padding:22px 18px}
 .ai-sobre .intro-logo{width:72px;height:72px}
 .ai-sobre .intro-texto{font-size:17px}
 .ai-sobre .temas,.ai-sobre .valores{grid-template-columns:1fr}
 .ai-sobre h2{font-size:21px}
}
</style>

<div class="ai-sobre">

  <div class="intro">
    <span class="intro-logo" role="img" aria-label="Logótipo {{BLOG_NAME}}"></span>
    <div class="intro-texto">
      {{SOBRE_INTRO_HTML}}
      <span class="intro-lema">{{TAGLINE_UPPER_H}}</span>
    </div>
  </div>

  <h2>Quem somos</h2>
  {{SOBRE_QUEM_SOMOS_HTML}}

  <h2>O que encontras aqui</h2>
  <div class="temas">
    {{SOBRE_TEMAS_HTML}}
  </div>

  <h2>A nossa forma de trabalhar</h2>
  <div class="valores">
    {{VALORES_HTML}}
  </div>

  <div class="cta">
    <h2>Vamos aprender juntos?</h2>
    <p>Explora os artigos mais recentes ou fala connosco para sugerir temas, tirar dúvidas ou propor colaborações.</p>
    <div class="botoes">
      <a class="btn" href="/">Explorar artigos</a>
      <a class="btn sec" href="/p/contacto.html">Contacto</a>
    </div>
  </div>

</div>
