# Estúdio de Temas para Blogger

Plataforma Next.js que transforma a skill `blogger-theme-kit` num construtor de temas por conversa.
O modelo (gpt-oss, via qualquer API compatível com OpenAI) **nunca vê nem escreve o XML**: edita uma
*ficha* JSON (~1–2 mil tokens) e o código monta o tema (150 KB) e as 6 páginas legais.

## Arrancar
```bash
npm install
cp .env.example .env.local     # LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
npm run dev                    # http://localhost:3000
npm run test:parity            # compara com a saída do rebrand.py original (byte a byte)
```

## Arquitectura
| Camada | Ficheiros | Função |
|---|---|---|
| Gerador | `src/lib/generator/*` | Porte do `rebrand.py` e do `personalizar_tema_pronto.py` para TypeScript (`sharp` para imagens). Saída idêntica à do Python. |
| Estado | `spec.ts` | `ThemeState = { ficha, cssExtra, remendos }`. É pequeno, versionável e fica fora do modelo. |
| Ferramentas | `agent/tools.ts` | `atualizar_ficha`, `listar/ler_regras_css`, `acrescentar_css`, `remendar`, `desfazer`, `validar`. |
| Contexto | `agent/context.ts` | Camadas: instruções fixas → estado actual → resumo → últimas mensagens (dentro do orçamento) → pedido. Resume sozinho quando passa de 60 % do orçamento. |
| API | `src/app/api/*` | `/init`, `/build`, `/chat`. |
| UI | `src/app/page.tsx` | Conversa + páginas em pré-visualização + ficha + ZIP. Estado em `localStorage` (trocar por base de dados). |

Contexto medido por pedido: **~1 100 tokens** (o tema sozinho teria ~48 000).

## Ainda por fazer
- Modo **artigo** da skill (`guia-artigo.md`).
- Envio de logo/banner na interface (o gerador já aceita `Assets`).
- Base de dados + autenticação (guardar `ThemeState`, versões e o resumo).
- Pré-visualização do próprio tema: o Blogger só renderiza o XML dentro do Blogger; hoje pré-visualizam-se as páginas HTML.
- `clean_banner.py` (OpenCV) não foi portado.
- Testar com o modelo real: o ciclo de ferramentas foi validado com um servidor simulado (`scripts/mock-llm.mjs`, `scripts/test-agent.ts`).
