# HumanizAÇÃO Platform
## Plataforma SaaS de Gestão Estratégica de Riscos Psicossociais

> **NR-1 · Portaria MTE nº 1.419/2024** — Conformidade obrigatória a partir de 26/05/2026

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript |
| Estilo | Tailwind CSS + design system HumanizAÇÃO |
| Backend | Next.js API Routes (serverless) |
| Banco de dados | Supabase (PostgreSQL + RLS + Realtime) |
| Autenticação | Supabase Auth SSR |
| Estado | Zustand |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Deploy | Vercel |

---

## Funcionalidades

### ✅ Implementadas
- **Auth completo** — login, sessão SSR, middleware de proteção de rotas
- **Multitenancy** — isolamento total por empresa via RLS no Supabase
- **Dashboard executivo** — 8 KPIs, heatmap, radar, risk bars, dados reais
- **Real-time** — atualização automática via Supabase Channels
- **Avaliações psicossociais** — criação, ativação, envio por link público
- **Formulário de resposta** — mobile-first, anônimo, multi-step, scoring automático
- **Armazenamento de respostas** — anonimato protegido, scoring por dimensão
- **Planos de ação** — CRUD, Kanban, lista, status, prioridade
- **AI Insights** — geração automática pós-avaliação, dismiss
- **Risk Assessment** — computed automaticamente após cada resposta
- **RBAC** — 10 papéis com controle de acesso por rota e API
- **Audit log** — rastreabilidade LGPD em todas as mutações
- **Notificações** — real-time por usuário
- **16 dimensões psicossociais** — alinhadas COPSOQ III + NR-1
- **Banco de perguntas template** — 13 perguntas NR-1 pré-validadas
- **5 setores VISAC** — dados reais seed incluído

---

## Pré-requisitos

```bash
node >= 18.17.0
npm >= 9.0.0
```

---

## Setup Local

### 1. Clone e instale

```bash
git clone <repo>
cd humanizacao
npm install
```

### 2. Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Anote: **Project URL** e **anon public key** e **service_role key**

### 3. Configure variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Rode as migrations

No painel Supabase → SQL Editor, execute em ordem:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_demo.sql
```

**Ou via CLI:**

```bash
npx supabase db push
```

### 5. Crie o usuário demo

No Supabase → Authentication → Users → Add User:
- Email: `bruna@humanizacao.com.br`
- Senha: `demo123456`

Depois no SQL Editor:
```sql
UPDATE profiles SET
  full_name = 'Bruna Coutinho',
  role = 'consultoria',
  company_id = 'a0000000-0000-0000-0000-000000000001',
  job_title = 'Psicóloga Organizacional',
  onboarding_completed = TRUE
WHERE email = 'bruna@humanizacao.com.br';
```

### 6. Rode o servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Deploy na Vercel

### 1. Push para GitHub

```bash
git init
git add .
git commit -m "feat: HumanizAÇÃO Platform v1.0"
git remote add origin https://github.com/SEU_USER/humanizacao
git push -u origin main
```

### 2. Deploy

```bash
npx vercel
```

Ou conecte o repositório em [vercel.com](https://vercel.com).

### 3. Variáveis de ambiente na Vercel

No painel Vercel → Settings → Environment Variables, adicione:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL (URL da Vercel, ex: https://humanizacao.vercel.app)
```

### 4. Configure o Supabase para produção

Em Supabase → Authentication → URL Configuration:
- **Site URL**: `https://SEU_DOMINIO.vercel.app`
- **Redirect URLs**: `https://SEU_DOMINIO.vercel.app/**`

---

## Estrutura do Projeto

```
humanizacao/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          # Página de login
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Layout com sidebar
│   │   │   └── page.tsx               # Dashboard executivo
│   │   ├── avaliacao/
│   │   │   ├── page.tsx               # Lista de avaliações
│   │   │   ├── nova/page.tsx          # Criar avaliação
│   │   │   └── responder/[id]/page.tsx # Formulário público
│   │   ├── planos-acao/page.tsx        # Planos (Kanban + Lista)
│   │   ├── api/
│   │   │   ├── dashboard/route.ts      # GET KPIs + analytics
│   │   │   ├── avaliacoes/route.ts     # CRUD avaliacoes
│   │   │   ├── avaliacoes/[id]/route.ts
│   │   │   ├── avaliacoes/[id]/compute-risk/route.ts
│   │   │   ├── respostas/route.ts      # Submit + analytics
│   │   │   └── planos/route.ts         # CRUD planos
│   │   ├── globals.css                 # Design system completo
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx            # Nav com RBAC
│   │   │   └── Topbar.tsx             # NR-1 countdown + notifs
│   │   └── dashboard/
│   │       ├── KPIGrid.tsx            # 8 KPIs animados
│   │       ├── HeatmapChart.tsx       # Heatmap temporal
│   │       ├── RadarChart.tsx         # Radar multidimensional
│   │       ├── RiskBars.tsx           # Barras por dimensão
│   │       ├── InsightsList.tsx       # AI Insights
│   │       ├── PlanosWidget.tsx       # Planos resumo
│   │       ├── ParticipationWidget.tsx # Donut chart
│   │       ├── SectorTable.tsx        # Ranking setores
│   │       └── NR1Banner.tsx          # Countdown NR-1
│   ├── lib/
│   │   └── supabase.ts                # Browser + Server + Admin + Middleware
│   ├── store/index.ts                  # Zustand stores
│   ├── types/index.ts                  # TypeScript types + constantes
│   └── middleware.ts                   # Auth guard + RBAC
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_initial_schema.sql      # Schema completo com RLS
│       └── 002_seed_demo.sql           # Dados demo
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.example
```

---

## Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `companies` | Empresas (multitenancy root) |
| `profiles` | Usuários (extends auth.users) |
| `sectors` | Setores por empresa |
| `dimensoes` | 16 dimensões psicossociais (seed incluído) |
| `perguntas` | Banco de questões NR-1 |
| `avaliacoes` | Avaliações com workflow de status |
| `respostas` | Respostas anônimas + scoring automático |
| `risk_assessments` | Snapshots computados de risco |
| `ai_insights` | Insights preditivos auto-gerados |
| `planos_acao` | Planos de ação (Kanban-ready) |
| `audit_log` | Rastreabilidade LGPD |
| `notifications` | Notificações real-time |

### Segurança

- **RLS ativo** em todas as tabelas — isolamento total por empresa
- **LGPD**: respostas anônimas sem `respondent_id`, apenas `respondent_token`
- **Audit log** em todas as mutações críticas
- **RBAC**: 10 papéis com controle granular por rota, API e UI

---

## API Routes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/dashboard` | KPIs, setores, insights, heatmap, radar |
| GET | `/api/avaliacoes` | Listar avaliações |
| POST | `/api/avaliacoes` | Criar avaliação + perguntas |
| GET/PATCH/DELETE | `/api/avaliacoes/[id]` | Operações por avaliação |
| POST | `/api/avaliacoes/[id]/compute-risk` | Computar risco (internal) |
| POST | `/api/respostas` | Submeter resposta (público) |
| GET | `/api/respostas` | Analytics de respostas |
| GET | `/api/planos` | Listar planos de ação |
| POST | `/api/planos` | Criar plano |
| PATCH | `/api/planos` | Atualizar plano |

---

## Papéis (RBAC)

| Papel | Acesso |
|-------|--------|
| `admin_master` | Tudo |
| `consultoria` | Tudo exceto admin de usuários |
| `rh_corporativo` | Analytics + planos + avaliações |
| `dho` | Analytics + planos |
| `sesmt` | Analytics + planos |
| `diretoria` | Dashboard + relatórios |
| `lideranca` | Dashboard limitado |
| `gestor` | Planos do seu setor |
| `auditoria` | Leitura total + audit log |
| `colaborador` | Apenas responder avaliações |

---

## Adicionando Novas Empresas

1. Via SQL:
```sql
INSERT INTO companies (name, slug, cnpj, plan, nr1_deadline)
VALUES ('Nova Empresa LTDA', 'nova-empresa', '00.000.000/0001-00', 'professional', '2026-05-26');
```

2. Criar usuário admin no Supabase Auth, depois:
```sql
UPDATE profiles SET
  company_id = '<company_id>',
  role = 'admin_master'
WHERE email = 'admin@nova-empresa.com.br';
```

---

## Desenvolvimento

```bash
# Rodar em modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Type check
npm run type-check

# Gerar tipos Supabase
npm run db:generate
```

---

## Contato

**HumanizAÇÃO Consultoria Organizacional**  
*Do diagnóstico à ação: saúde mental e gestão de riscos psicossociais no trabalho*

📧 contato@humanizacao.com.br  
🌐 humanizacao.com.br

---

*v1.0.0 · Maio 2026 · NR-1 Compliant*
