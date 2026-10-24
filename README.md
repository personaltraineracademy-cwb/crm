# Unnify CRM

CRM de vendas e atendimento pelo WhatsApp, com agentes de IA que trabalham junto com a equipe.
Faz parte da Unnify, ao lado do portal Unnify, do Unnify Pulse e do Unnify Work.

Roda no seu servidor. Os dados ficam com você. O código é aberto, sob a licença MIT.

[Instalar](#instalar) · [Atualizar](#atualizar) · [Funcionalidades](#funcionalidades) · [Stack](#stack) · [Licença](#licença)

---

## O que é

O Unnify CRM junta numa tela só o atendimento pelo WhatsApp, o funil de vendas e os agentes de
IA. Os agentes atendem, qualificam, movem o lead no funil, disparam automações e passam a
conversa para uma pessoa quando é hora.

Serve a qualquer negócio que vende conversando: lojas, clínicas, imobiliárias, infoprodutos,
agências e prestadores de serviço. O vocabulário muda por funil: o lead pode virar _Cliente_,
_Paciente_ ou _Comprador_.

É multiempresa. Cada organização vê só os próprios dados, e a LGPD faz parte do desenho.

## Funcionalidades

**Agentes de IA que operam o CRM**

- Base de conhecimento por organização (RAG), memória da operação e skills que o agente executa
  sozinho durante o atendimento.
- Análise de sentimento, passagem da IA para uma pessoa com registro, e a IA como responsável pelo
  atendimento, com as mesmas regras de uma pessoa.
- Teto de gasto com IA por organização.
- Melhoria contínua com aprovação humana: conversas resolvidas viram conhecimento, a tela
  **Evolução da IA** mostra onde o agente erra, e **Propostas** são melhorias que a própria IA
  sugere e que só entram com aprovação.
- Escolha do provedor: OpenRouter, Anthropic ou OpenAI, definido na instalação e trocável depois
  pela tela, por parte do sistema.

**WhatsApp**

- Conexão por QR code (WAHA, vários números) ou pelo canal oficial da Meta (Cloud API, com
  templates aprovados e sincronizados).
- Proteção contra banimento: ritmo de envio, intervalo variável e janela de horário.
- Mídia guardada no Storage e detecção de pedido de descadastro.

**Nada morre no silêncio**

- Follow-up que retoma a conversa esfriada, com tempo adaptativo e gatilhos por etapa do funil.
- **Radar** do que corre risco de ficar sem resposta.
- Central de avisos para o que precisa de decisão humana.

**Funil e governança**

- Kanban com vocabulário configurável, gestão de funis pela tela, contatos e tags.
- Permissões por papel no servidor, atribuição e transferência com registro, fila com rodízio e
  roteamento automático por intenção.

**Webhooks e automações**

- Fontes de captação: um endereço público que recebe leads de landing pages, formulários,
  Zapier ou n8n e já põe o lead no funil escolhido.
- Automações no formato QUANDO / SE / ENTÃO: adicionar tag, mover no funil, atribuir, mandar
  mensagem no WhatsApp ou avisar outro sistema por webhook de saída.

**Instalação própria**

- Instala e atualiza com um comando, ou atualiza com um clique pela tela.
- Sem versão paga e sem funcionalidade travada.

### As telas

| Grupo            | Telas                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atendimento**  | Inbox · Radar · Respostas rápidas                                                                                                                          |
| **CRM**          | Kanban · Contatos · Funis                                                                                                                                  |
| **Agente de IA** | Agentes · Follow-ups · Roteadores · Provedores e Credenciais · Conhecimento · Memória · Skills · Casos · Alertas · Propostas · Execuções · Uso e orçamento |
| **Canais**       | Conexões · Nuvemshop · Webhooks                                                                                                                            |
| **Análise**      | Desempenho · Evolução da IA · Audit Log                                                                                                                    |
| **Organização**  | Equipe · Distribuição de atendimento · Organização · LGPD · API Tokens · Segurança (MFA, códigos de recuperação, sessões) · Perfil, Notificações, Billing  |

## Stack

| Camada            | Escolha                                                           |
| ----------------- | ----------------------------------------------------------------- |
| **Frontend**      | Next.js 16 (App Router) + React 19 + TypeScript estrito           |
| **Estilo**        | Tailwind + shadcn/ui                                              |
| **Banco**         | Supabase (Postgres com RLS e `vector`)                            |
| **Auth**          | Supabase Auth via `@supabase/ssr`                                 |
| **Realtime**      | Supabase Realtime                                                 |
| **Storage**       | Supabase Storage, bucket privado com URLs assinadas               |
| **WhatsApp**      | WAHA (engine NOWEB) e Meta Cloud API                              |
| **Filas**         | Tabela `event_log` + workers por cron                             |
| **Rate limit**    | Upstash Redis                                                     |
| **IA**            | Vercel AI SDK: OpenRouter, Requesty, Anthropic, OpenAI e Google   |
| **Validação**     | Zod                                                               |
| **Observability** | Sentry, opcional, com CPF, telefone e e-mail mascarados no envio  |
| **Hospedagem**    | Qualquer VPS com Docker, x86_64 ou ARM64. Nada é compilado na VPS |

## Instalar

### O que você precisa

| Item         | Detalhe                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------ |
| **VPS**      | Linux com acesso root. 4 GB de RAM recomendados. Se faltar Docker, o instalador instala.   |
| **Domínio**  | Um registro **A** apontando para o IP da VPS (ex.: `crm.suaempresa.com.br`).               |
| **Banco**    | Um projeto no [Supabase](https://supabase.com).                                            |
| **IA**       | Uma chave de OpenRouter, Anthropic ou OpenAI. Pode ficar para depois.                      |
| **WhatsApp** | O número da empresa, conectado por QR code no primeiro acesso, ou o canal oficial da Meta. |

### Passo a passo

Entre na VPS por SSH e rode:

```bash
git clone https://github.com/personaltraineracademy-cwb/crm.git
cd crm
bash hostgator-setup-kit/install.sh
```

O instalador pergunta só o que é seu: domínio, chaves do Supabase, provedor de IA e o e-mail e a
senha do administrador. Ele valida cada resposta, gera os segredos, aplica o banco
(`supabase/baseline.sql`), cria o administrador, sobe tudo com HTTPS automático e confere a saúde
no fim. Também instala o cron das automações e o agente que faz a atualização pela tela.

Você não instala Node nem compila nada: as imagens já vêm prontas de
`ghcr.io/personaltraineracademy-cwb`. Rodar o instalador de novo não quebra nada; ele retoma de
onde parou.

- **Sem perguntas:** copie `.env.hostgator.example` para `.env`, preencha e rode
  `bash hostgator-setup-kit/install.sh --yes`.
- **VPS com proxy próprio** (Hostinger, Coolify, Dokploy, CapRover): o instalador detecta e
  publica o CRM através dele.

Detalhes e todos os scripts do kit: [`hostgator-setup-kit/`](hostgator-setup-kit/README.md).

Depois, abra `https://<seu-domínio>`, entre com o administrador e conecte o WhatsApp.

## Atualizar

Cada versão é publicada neste repositório,
[`personaltraineracademy-cwb/crm`](https://github.com/personaltraineracademy-cwb/crm), com uma tag
`vX.Y.Z`. A atualização sempre leva à versão publicada mais nova, nunca a um commit solto.

**Pela tela (recomendado).** Quando há versão nova, o menu lateral mostra **Nova versão** para o
dono do servidor. Em **Configurações › Atualização** você vê o que muda e acompanha cada fase. O
backup do banco é feito antes. Se a versão nova subir quebrada, o agente volta sozinho para a
anterior.

**Pelo terminal.** Na pasta da instalação:

```bash
bash hostgator-setup-kit/update.sh
```

Ele confere se há versão nova, faz backup do banco, baixa o código, atualiza o banco, puxa as
imagens novas e confere a saúde no fim. Não volta para uma versão anterior sem `--force`.

| Script              | Função                                    |
| ------------------- | ----------------------------------------- |
| `install.sh`        | Instala tudo (pode rodar de novo)         |
| `update.sh`         | Atualiza para a versão nova, com backup   |
| `backup.sh`         | Backup do banco e das sessões do WhatsApp |
| `restore.sh`        | Restaura um backup num banco vazio        |
| `reset-password.sh` | Redefine a senha de um usuário            |
| `reset-mfa.sh`      | Remove o MFA de quem perdeu o celular     |
| `healthcheck.sh`    | Diagnóstico de todos os serviços          |

O plano grátis do Supabase não faz backup sozinho. Agende o `backup.sh` no cron.

## Responsabilidades

Cada instalação roda na infraestrutura de quem a hospeda: VPS, banco e chave de IA próprios.
Quem hospeda é o **controlador** dos dados pessoais tratados ali, com as obrigações da LGPD.

A telemetria de erros (Sentry) é perguntada na instalação e pode ser desligada a qualquer momento
com `SENTRY_DSN=off` no `.env`.

Para falhas de segurança, veja [`SECURITY.md`](SECURITY.md). Para dúvidas e bugs, veja
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

O Unnify CRM é distribuído sob a licença **MIT**. Veja [`LICENSE`](LICENSE).

Ele é derivado de um projeto de código aberto sob a mesma licença. Os avisos de copyright de
todos os autores estão no `LICENSE` e precisam acompanhar qualquer cópia ou parte substancial
do código. O software é fornecido "como está", sem garantias.
