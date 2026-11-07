# Automações n8n — catálogo PT-BR + workflows prontos

Coleção de **10 workflows prontos para importar** no n8n deste starter kit,
com foco em **automação de negócio + IA local** (Ollama e Qdrant). Tudo em
português do Brasil, sem depender de APIs pagas de IA.

> Testado com **n8n 2.45.7** (imagem `n8nio/n8n:latest` do kit).
> Os arquivos usam as versões de nó dessa instalação. Em outras versões do
> n8n, algum nó pode precisar ser reaberto/atualizado no editor.

---

## Índice

- [O que está incluído](#o-que-está-incluído)
- [Os 5 mais pedidos](#os-5-mais-pedidos)
- [Como importar](#como-importar)
- [Credenciais e modelos](#credenciais-e-modelos)
- [Workflows incluídos](#workflows-incluídos)
- [Catálogo de ideias por área](#catálogo-de-ideias-por-área)
- [Exemplo de dados](#exemplo-de-dados)
- [Boas práticas](#boas-práticas)
- [Solução de problemas](#solução-de-problemas)
- [Checklist antes de produção](#checklist-antes-de-produção)
- [O que foi validado](#o-que-foi-validado)

---

## O que está incluído

```text
docs/n8n-automacoes/
├── README.md                  # este catálogo
├── workflows/                 # 10 workflows .json prontos para importar
│   ├── 01-rag-ingestao-documentos.json
│   ├── 02-rag-chat-documentos.json
│   ├── 03-triagem-emails-ia.json
│   ├── 04-resumo-rss-diario.json
│   ├── 05-extracao-faturas-pdf.json
│   ├── 06-qualificacao-leads.json
│   ├── 07-monitoramento-site-alerta.json
│   ├── 08-agente-telegram-rag.json
│   ├── 09-relatorio-semanal-ia.json
│   └── 10-alerta-erros-globais.json
└── exemplos/
    └── vendas-exemplo.csv     # dados de exemplo para o workflow 09
```

Nenhum workflow vem **ativo** e nenhuma credencial real está configurada.
Os JSONs apenas referenciam as credenciais locais que já existem no kit:

| Credencial | ID | Usada em |
|---|---|---|
| `Local Ollama service` | `xHuYe0MDGOs9IpBW` | chat, classificador, extrator, embeddings |
| `Local QdrantApi database` | `sFfERYppMeBnFNeA` | ingestão e busca vetorial |

Se o seu n8n não tiver essas credenciais (por exemplo, banco já inicializado
sem o `demo-data`), basta criar/selecionar credenciais equivalentes nos nós.
Os IDs acima são os do `n8n/demo-data/credentials/` deste repositório.

---

## Os 5 mais pedidos

1. **Chat sobre seus documentos (RAG local)** — workflows **01 + 02**.
   Indexa PDFs no Qdrant e responde com base nos trechos, 100% local.
2. **Triagem de e-mails com IA** — workflow **03**.
   Classifica, alerta no Telegram e marca como lido.
3. **Qualificação de leads** — workflow **06**.
   Score de 0 a 100, grava em JSONL e avisa o time quando o lead é quente.
4. **Relatório semanal de vendas** — workflow **09**.
   Lê CSV, agrega indicadores e gera narrativa executiva.
5. **Agente de atendimento no Telegram** — workflow **08**.
   Bot com memória por conversa e busca na base interna.

---

## Como importar

### Opção A — pela interface (recomendado para começar)

1. Abra <http://localhost:5678>.
2. Vá em **Workflows**.
3. Use o menu **⋮ → Import from File...** (ou `Ctrl+O`) e selecione um JSON
   por vez em `docs/n8n-automacoes/workflows/`.
4. Abra o workflow importado, confira os nós com aviso de credencial e
   selecione as credenciais locais.
5. Revise os placeholders (`SEU_CHAT_ID`, `voce@exemplo.com`) antes de ativar.

> O navegador lê os arquivos da sua máquina; não é necessário copiá-los para
> dentro do container.

### Opção B — pela CLI (importa os 10 de uma vez)

O diretório `./shared` já é montado no container como `/data/shared`:

```bash
# na raiz do repositório
mkdir -p shared/n8n-automacoes
cp docs/n8n-automacoes/workflows/*.json shared/n8n-automacoes/

docker exec n8n n8n import:workflow \
  --separate \
  --input=/data/shared/n8n-automacoes
```

Conferir o resultado:

```bash
docker exec n8n n8n list:workflow
```

Observações:

- A CLI **não importa credenciais**; ela apenas cria os workflows.
- Importar o mesmo arquivo duas vezes cria duplicatas (não há upsert sem `id`).
- Os workflows entram **inativos**. Abra a interface para revisar e ativar.

---

## Credenciais e modelos

### 1. Ollama (chat)

A credencial `Local Ollama service` já aponta para `http://ollama:11434`.
Confira em **Credentials → Local Ollama service**.

O kit baixa automaticamente o modelo `llama3.2` no primeiro boot. Para baixar
manualmente (ou garantir que está presente):

```bash
docker exec ollama ollama pull llama3.2
```

> Se o container `ollama` não existir, suba o perfil correspondente:
> `docker compose --profile cpu up -d` (ou `gpu-nvidia` / `gpu-amd`).

### 2. Ollama (embeddings) — obrigatório para RAG

Os workflows 01, 02 e 08 usam `nomic-embed-text` para gerar embeddings.
Esse modelo **não** é baixado pelo `docker-compose.yml`:

```bash
docker exec ollama ollama pull nomic-embed-text
```

Sem ele, a ingestão no Qdrant falha com erro de modelo não encontrado.

### 3. Qdrant

A credencial `Local QdrantApi database` já aponta para `http://qdrant:6333`
(sem API key). O dashboard fica em <http://localhost:6333/dashboard>.

A coleção `documentos` é criada automaticamente no primeiro `insert`
do workflow 01, com a dimensão do modelo de embeddings.

### 4. Telegram (opcional)

Usado nos workflows 03, 06, 07, 08 e 10.

1. No Telegram, fale com o [@BotFather](https://t.me/BotFather) e crie um bot.
2. Copie o **token**.
3. No n8n, crie a credencial **Telegram API** com esse token.
4. Envie `/start` para o seu bot.
5. Descubra o `chat_id`:

```bash
curl "https://api.telegram.org/bot<SEU_TOKEN>/getUpdates"
```

O valor está em `message.chat.id`. Substitua `SEU_CHAT_ID` nos nós (ou use
uma expressão/credencial, se preferir).

> O workflow 08 já responde dinamicamente usando o chat de origem; nele não é
> preciso trocar o `SEU_CHAT_ID`.

### 5. Gmail (opcional)

Usado nos workflows 03, 04 e 09.

1. Crie um projeto no Google Cloud e ative a **Gmail API**.
2. Configure a tela de consentimento OAuth.
3. Crie uma credencial **OAuth Client ID** do tipo *Web application*.
4. Adicione o redirect URI:
   `http://localhost:5678/rest/oauth2-credential/callback`
5. No n8n, crie a credencial **Gmail OAuth2** e autorize.
6. Troque `voce@exemplo.com` pelo destinatário real.

Se você acessa o n8n por outro domínio/porta, ajuste também a variável
`WEBHOOK_URL` do container para os links e callbacks funcionarem.

### 6. SMTP (alternativa ao Gmail)

Se preferir não usar OAuth do Google, substitua os nós Gmail por
**Send Email** e configure uma credencial SMTP (host, porta, usuário, senha).

---

## Workflows incluídos

| # | Workflow | Gatilho | IA / integrações | Saída |
|---|---|---|---|---|
| 01 | RAG: ingestão de documentos | Formulário (PDF) | Ollama embeddings + Qdrant | Coleção `documentos` |
| 02 | RAG: chat sobre documentos | Chat | Agente + Ollama + memória + Qdrant | Resposta no chat |
| 03 | Triagem de e-mails com IA | Gmail (1 min) | Text Classifier + Ollama | Telegram + marcar como lido |
| 04 | Resumo diário de notícias | Diário 08:00 | RSS + LLM | E-mail com resumo |
| 05 | Extração de faturas em PDF | Formulário (PDF) | Information Extractor + Ollama | `/data/shared/faturas.jsonl` |
| 06 | Qualificação de leads | Formulário | Information Extractor + Ollama | `/data/shared/leads.jsonl` + Telegram |
| 07 | Monitoramento de site | A cada 5 min | HTTP Request | Telegram se status ≥ 400 |
| 08 | Agente de atendimento no Telegram | Telegram | Agente + Ollama + memória + Qdrant | Resposta no Telegram |
| 09 | Relatório semanal de vendas | Segunda 08:00 | CSV + Code + LLM | E-mail com narrativa |
| 10 | Alerta global de erros | Error Trigger | Code | Telegram |

### Detalhes e ajustes por workflow

#### 01 — RAG: ingestão de documentos

- Formulário: **Base de conhecimento (RAG)** → URL de produção
  `http://localhost:5678/form/rag-ingestao`.
- Fluxo: PDF → extração de texto → divisão em chunks (1000/150) → embeddings
  Ollama → `insert` no Qdrant.
- A coleção é criada automaticamente. Confira no dashboard do Qdrant.
- **Pré-requisito:** `docker exec ollama ollama pull nomic-embed-text`.
- Para reindexar, rode o formulário novamente. Não há deduplicação por
  arquivo; envie cada PDF uma vez.

#### 02 — RAG: chat sobre documentos

- Abra o workflow e clique em **Chat** no rodapé do editor.
- O agente responde **somente** com base nos trechos retornados pela
  ferramenta `buscar_documentos`.
- Memória por `sessionId` do chat (janela de 10 mensagens).
- **Pré-requisito:** workflow 01 já executado e coleção `documentos` populada.

#### 03 — Triagem de e-mails com IA

- Gmail Trigger consulta a cada minuto (o workflow precisa estar ativo).
- Categorias: **Urgente**, **Financeiro**, **Suporte**, **Outros** + fallback
  **Other**.
- Urgente e Financeiro disparam Telegram; Suporte/Outros/fallback apenas
  marcam como lido.
- Ajuste as categorias e o texto dos alertas conforme o seu processo.
- Para arquivar/rotular em vez de marcar como lido, troque o nó Gmail.

#### 04 — Resumo diário de notícias (RSS + IA)

- Roda todos os dias às 08:00 no timezone do container.
- Lê o RSS de tecnologia do G1; troque a URL à vontade.
- Limita a 10 notícias, seleciona campos, agrupa e pede um resumo em 5 tópicos.
- Envia por Gmail. Sem Gmail? Substitua o último nó por **Convert to File**
  (`toText`) + **Read/Write Files from Disk** e salve em
  `/data/shared/resumos.txt`.
- Para testar sem esperar o horário, use **Execute workflow**.

#### 05 — Extração de faturas em PDF

- Formulário: **Extração de faturas** → `/form/faturas`.
- Extrai fornecedor, CNPJ, número, data, valor total, impostos e moeda.
- Grava uma linha JSON por fatura em `/data/shared/faturas.jsonl`
  (no host: `./shared/faturas.jsonl`).
- **Atenção:** LLMs podem errar números. Valide os valores antes de usar em
  contabilidade. Para produção, troque o arquivo por Postgres/Google Sheets.

#### 06 — Qualificação de leads com IA

- Formulário: **Contato comercial** → `/form/leads`.
- A IA gera `score` (0–100), classificação (quente/morno/frio), resumo e
  próximo passo.
- Todos os leads vão para `/data/shared/leads.jsonl`.
- Score ≥ 70 dispara alerta no Telegram.
- Ajuste o limiar no nó **Score >= 70?**.

#### 07 — Monitoramento de site com alerta

- Verifica `https://example.com` a cada 5 minutos.
- Usa `fullResponse` + `neverError` para tratar status ≥ 400 sem falhar o
  workflow.
- Troque a URL, o texto e o `chat_id`.
- Para APIs com autenticação, adicione headers/credenciais no HTTP Request.

#### 08 — Agente de atendimento no Telegram (RAG)

- Bot com memória por chat (janela de 12 mensagens).
- Usa a ferramenta `buscar_documentos` no Qdrant.
- **Pré-requisitos:** workflow 01 executado, modelo de embeddings baixado e
  credencial Telegram configurada.
- Ative o workflow e envie uma mensagem para o bot.

#### 09 — Relatório semanal de vendas com IA

- Roda segunda-feira às 08:00.
- Lê `/data/shared/vendas.csv` (copie o exemplo antes):

```bash
cp docs/n8n-automacoes/exemplos/vendas-exemplo.csv shared/vendas.csv
```

- O Code agrega total, ticket médio, por região e top produtos; o LLM escreve
  a narrativa executiva.
- Troque o destinatário e configure o Gmail (ou SMTP).
- Colunas esperadas: `data, regiao, produto, vendedor, quantidade, valor`.

#### 10 — Alerta global de erros

- Ative este workflow.
- Em **Settings → Error Workflow** de cada outro workflow, selecione
  **10 — Alerta global de erros**.
- Qualquer falha envia ao Telegram o nome do workflow, a mensagem de erro e o
  link da execução.

---

## Catálogo de ideias por área

Legenda: ✅ = já implementado neste pacote · 💡 = ideia para implementar
(reaproveitando os mesmos padrões).

### Atendimento e vendas

| Caso de uso | Como fazer | Status |
|---|---|---|
| Base de conhecimento com PDFs | Form → Extract → Qdrant + Ollama embeddings | ✅ 01 |
| Chat que responde sobre documentos internos | Chat Trigger → Agente + Qdrant tool | ✅ 02 |
| Agente de atendimento no Telegram | Telegram Trigger → Agente + memória + Qdrant | ✅ 08 |
| Triagem automática de e-mails | Gmail Trigger → Text Classifier → Telegram | ✅ 03 |
| Qualificação de leads | Form → Information Extractor → score + alerta | ✅ 06 |
| Follow-up de proposta parada há N dias | Schedule + Postgres/Sheets → lembrete | 💡 |
| Resumo de reuniões | Transcrição (Whisper/API) → LLM → ata + ações | 💡 |
| FAQ no WhatsApp | Evolution API/Cloud API → Agente + RAG | 💡 |
| Recuperação de carrinho abandonado | Webhook da loja → espera → cupom/e-mail | 💡 |
| NPS pós-atendimento | Form/webhook → LLM classifica sentimento → dashboard | 💡 |

### Marketing e conteúdo

| Caso de uso | Como fazer | Status |
|---|---|---|
| Resumo diário de notícias do setor | Schedule → RSS → LLM → e-mail | ✅ 04 |
| Posts a partir de uma pauta | Form → LLM → aprovação → publicação | 💡 |
| Legendas para Instagram/YouTube | LLM + transcrição/descrição → revisão | 💡 |
| Monitoramento de menções e sentimento | RSS/APIs → Sentiment Analysis → alerta | 💡 |
| Cross-posting LinkedIn/X | LLM adapta formato → APIs | 💡 |
| Agrupamento de palavras-chave para SEO | Planilha → embeddings + LLM | 💡 |
| Geração de descrição de produto | Planilha → LLM → Google Sheets | 💡 |

### Financeiro e administrativo

| Caso de uso | Como fazer | Status |
|---|---|---|
| Extração de faturas/notas em PDF | Form → Extract → Information Extractor → JSONL | ✅ 05 |
| Relatório semanal de vendas | CSV → Code → LLM → e-mail | ✅ 09 |
| Conciliação bancária | OFX/CSV → Code → LLM sugere matches | 💡 |
| Alertas de contas a vencer | Postgres/Sheets → Schedule → Telegram/e-mail | 💡 |
| Classificação de despesas por centro de custo | Extrato → LLM/regras → planilha | 💡 |
| Régua de cobrança de inadimplentes | Postgres → Schedule → e-mail/WhatsApp | 💡 |
| Resumo de contratos | PDF → Extract → LLM → campos-chave | 💡 |

### Dados e TI

| Caso de uso | Como fazer | Status |
|---|---|---|
| Monitoramento de site/API | Schedule → HTTP → IF → Telegram | ✅ 07 |
| Alerta global de erros | Error Trigger → Telegram | ✅ 10 |
| ETL de planilhas para Postgres | Sheets/CSV → Code → Postgres | 💡 |
| Deduplicação e enriquecimento de cadastros | Postgres → LLM/regras → atualização | 💡 |
| Ingestão contínua de documentos | Local File Trigger → Extract → Qdrant | 💡 |
| Healthcheck de containers | HTTP/Docker API → alerta | 💡 |
| Backup de workflows para git | Export periódico + commit | 💡 |
| Auditoria de execuções com falha | Error Trigger → Postgres → dashboard | 💡 |

### RH e operações

| Caso de uso | Como fazer | Status |
|---|---|---|
| Triagem de currículos | Form/PDF → Extract → score de aderência | 💡 |
| Onboarding automatizado | Form → checklist → e-mails/tarefas | 💡 |
| Pesquisa de clima | Form → Sentiment Analysis → resumo | 💡 |
| Controle de férias/ausências | Sheets/Postgres → Schedule → lembretes | 💡 |
| Base de políticas internas para RH | RAG (reaproveita 01/02) | 💡 |

---

## Exemplo de dados

`exemplos/vendas-exemplo.csv` contém 18 vendas fictícias de outubro/2026:

```csv
data,regiao,produto,vendedor,quantidade,valor
2026-10-05,Sudeste,Plano Starter,Ana Souza,12,11880.00
...
```

Para usar no workflow 09:

```bash
cp docs/n8n-automacoes/exemplos/vendas-exemplo.csv shared/vendas.csv
```

O arquivo fica visível dentro do container como `/data/shared/vendas.csv`.

---

## Boas práticas

### Idempotência

- Triggers de e-mail/Telegram podem repetir eventos após reinício ou
  reprocessamento. Use o `message.id`/`update_id` para evitar duplicatas.
- Antes de gravar em banco, crie uma chave única (ex.: `message_id`) e use
  `ON CONFLICT DO NOTHING`.
- Para arquivos JSONL, inclua um identificador e verifique duplicatas em um
  Code node, se necessário.
- Formulários geram um envio por clique; para evitar duplo envio, valide no
  front ou use um campo de idempotência.

### Tratamento de erros

- Ative o workflow **10** e configure-o como **Error Workflow** dos demais.
- Em nós críticos, use **Settings → Retry On Fail** (ex.: 3 tentativas, 5 s).
- Para HTTP, prefira `neverError` + `fullResponse` quando o status fizer parte
  da regra de negócio (como no workflow 07).
- Evite `continueOnFail` silencioso sem um nó de auditoria.

### Segurança e LGPD

- Não envie dados pessoais para APIs externas sem base legal e contrato.
- Prefira IA local (Ollama) para documentos sensíveis.
- Minimize dados: extraia apenas os campos necessários.
- Defina retenção para arquivos em `./shared` e para o histórico de execuções.
- Restrinja o acesso ao n8n (autenticação, TLS, reverse proxy, VPN).
- Nunca comite credenciais; use o cofre do n8n e o `.env`.
- Cuidado com formulários públicos: use autenticação (`n8nUserAuth` ou
  basic auth) quando expostos na internet.

### Rate limits e custo

- Telegram: ~30 mensagens/s por bot; evite loops de alerta.
- Gmail: respeite as cotas diárias e o polling de 1 minuto.
- Ollama: uma inferência por vez consome CPU/GPU; para volume, use fila,
  `batching` no HTTP Request ou um worker dedicado.
- Adicione `Limit` antes de LLMs para não enviar listas enormes.

### Versionamento e backup

- Exporte workflows para JSON e versione no git após mudanças.
- Faça backup do volume do Postgres **e** guarde o `N8N_ENCRYPTION_KEY`.
  Sem essa chave, as credenciais salvas não podem ser descriptografadas.
- Documente as credenciais necessárias (sem os segredos) no README do time.

### Timezone

- Os horários usam o timezone do container. Defina `GENERIC_TIMEZONE`
  (ex.: `America/Sao_Paulo`) no `.env` se necessário.
- O schedule do workflow 09 usa segunda-feira (`triggerAtDay: [1]`).

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `model "nomic-embed-text" not found` | Modelo de embeddings não baixado | `docker exec ollama ollama pull nomic-embed-text` |
| `connect ECONNREFUSED http://ollama:11434` | Container do Ollama não está rodando | `docker compose --profile cpu up -d` (ou GPU) e `docker compose ps` |
| `model "llama3.2" not found` | Modelo de chat ausente | `docker exec ollama ollama pull llama3.2` |
| Coleção `documentos` vazia/inexistente | Workflow 01 não rodou ou PDF sem texto | Rode o 01, confira o dashboard do Qdrant e use PDF com texto (não escaneado) |
| Busca RAG sem resultados | Embeddings diferentes entre ingestão e consulta | Use o mesmo modelo (`nomic-embed-text`) nos dois workflows |
| `chat not found` no Telegram | `chat_id` errado ou bot não iniciado | Envie `/start` ao bot e confira `getUpdates` |
| Telegram não envia | Credencial ausente ou workflow inativo | Selecione a credencial e ative o workflow |
| Gmail `invalid_grant` | Token expirado/revogado | Reconecte a credencial OAuth2 |
| Formulário 404 | Workflow inativo na URL de produção | Ative o workflow ou use a URL de teste do nó |
| `The file ... could not be accessed` | Caminho errado ou arquivo inexistente | Use `/data/shared/...`; no host, `./shared/...` |
| `ENOENT` ao gravar | Diretório pai inexistente | Os workflows gravam na raiz de `/data/shared`; para subpastas, crie antes com `mkdir -p shared/minha-pasta` |
| Workflow não roda no horário | Workflow inativo ou timezone diferente | Ative e confira `GENERIC_TIMEZONE` |
| Aviso de credencial após importar | IDs de credencial diferentes | Abra o nó e selecione a credencial local |
| Nó com triângulo de aviso | Versão de nó diferente da instalação | Abra o nó e salve; ou atualize o n8n |
| LLM inventa números | Modelo pequeno/alucinação | Baixe `temperature`, valide com Code/regex e revise antes de usar |

### Dicas de diagnóstico

```bash
# containers e perfis ativos
docker compose ps

# logs do n8n
docker logs -f n8n

# modelos disponíveis no Ollama
docker exec ollama ollama list

# coleções no Qdrant
curl -s http://localhost:6333/collections

# arquivos gerados pelos workflows
ls -l shared/
```

No n8n, abra **Executions** para ver a entrada/saída de cada nó. Para testar
sem esperar um gatilho, use **Execute workflow** no editor.

---

## Checklist antes de produção

- [ ] Troquei todos os placeholders (`SEU_CHAT_ID`, `voce@exemplo.com`, URLs).
- [ ] Selecionei as credenciais corretas em todos os nós.
- [ ] Baixei `llama3.2` e `nomic-embed-text`.
- [ ] Rodei o workflow 01 e confirmei a coleção no Qdrant.
- [ ] Testei cada workflow manualmente antes de ativar.
- [ ] Configurei o workflow 10 como Error Workflow dos demais.
- [ ] Ativei **Retry On Fail** nos nós críticos.
- [ ] Defini `GENERIC_TIMEZONE` e conferi os horários.
- [ ] Restringi o acesso ao n8n (auth, TLS, proxy/VPN).
- [ ] Revisei LGPD: dados mínimos, retenção e base legal.
- [ ] Configurei backup do Postgres + `N8N_ENCRYPTION_KEY`.
- [ ] Versionei os JSONs no git.
- [ ] Monitorei as primeiras execuções reais (Executions/Telegram).
- [ ] Documentei quem recebe cada alerta e como agir.

---

## O que foi validado

Validações feitas neste repositório com o n8n **2.45.7**:

- ✅ **Estrutura dos 10 JSONs**: nomes e IDs únicos, conexões para nós
  existentes, tipos/versões de nó suportados.
- ✅ **Parâmetros vs. schema dos nós instalados**: todas as chaves de
  `parameters`, coleções e `fixedCollection` conferem com as definições
  exportadas pelo n8n.
- ✅ **Importação real**: teste em container descartável com
  `n8n import:workflow --separate` → “Successfully imported 10 workflows”.
- ✅ **Sintaxe dos arquivos** e codificação UTF-8 (acentos preservados).

O que **não** foi validado (exige ambiente com modelos e credenciais):

- ⚠️ Execução ponta a ponta dos nós de IA (Ollama não estava em execução e os
  modelos não estavam baixados no momento dos testes).
- ⚠️ Ingestão/busca real no Qdrant (coleção não populada).
- ⚠️ Envio real de Telegram/Gmail (sem credenciais configuradas).
- ⚠️ Qualidade das respostas do LLM para cada caso de uso.

Antes de ativar, rode cada workflow manualmente e confira a saída dos nós de
IA. Para os fluxos financeiros (05 e 09), valide os números com uma fonte
confiável.

---

## Próximos passos sugeridos

1. Suba o perfil do Ollama e baixe os dois modelos.
2. Importe os workflows 01 e 02, indexe um PDF e teste o chat.
3. Configure Telegram e ative o workflow 10 (erros) + 07 (monitoramento).
4. Adapte o workflow 03 ao seu processo de e-mail.
5. Use o catálogo acima como backlog: cada ideia 💡 reaproveita os padrões
   já validados aqui.
