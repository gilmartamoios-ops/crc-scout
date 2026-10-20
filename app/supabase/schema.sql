-- ============================================
-- CRC.SCOUT — DATABASE SCHEMA
-- ============================================

create extension if not exists "pgcrypto";


-- ============================================
-- 1. NÚCLEOS
-- ============================================

create table if not exists nucleos (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  slug text unique not null,

  cidade text,
  estado text,

  descricao text,

  status text not null default 'ativo'
    check (status in ('ativo', 'inativo', 'pendente')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- 2. MEMBROS
-- ============================================

create table if not exists membros (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  email text unique,

  telefone text,

  nucleo_id uuid references nucleos(id)
    on delete set null,

  funcao text default 'membro',

  status text not null default 'ativo'
    check (status in ('ativo', 'inativo', 'pendente')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- 3. COMUNIDADES
-- ============================================

create table if not exists comunidades (
  id uuid primary key default gen_random_uuid(),

  nucleo_id uuid references nucleos(id)
    on delete cascade,

  nome text not null,
  slug text unique not null,

  cidade text,
  estado text,

  descricao text,

  status text not null default 'ativa'
    check (status in ('ativa', 'inativa', 'pendente')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- 4. AÇÕES
-- ============================================

create table if not exists acoes (
  id uuid primary key default gen_random_uuid(),

  nucleo_id uuid references nucleos(id)
    on delete cascade,

  comunidade_id uuid references comunidades(id)
    on delete set null,

  titulo text not null,
  descricao text,

  status text not null default 'planejada'
    check (
      status in (
        'planejada',
        'em_andamento',
        'concluida',
        'cancelada'
      )
    ),

  data_inicio date,
  data_fim date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- 5. REGISTROS / OBSERVAÇÕES DO SCOUT
-- ============================================

create table if not exists scout_registros (
  id uuid primary key default gen_random_uuid(),

  nucleo_id uuid references nucleos(id)
    on delete cascade,

  comunidade_id uuid references comunidades(id)
    on delete set null,

  membro_id uuid references membros(id)
    on delete set null,

  tipo text not null,

  titulo text,
  descricao text,

  dados jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);


-- ============================================
-- 6. CONVITES / LINKS PÚBLICOS
-- ============================================

create table if not exists convites (
  id uuid primary key default gen_random_uuid(),

  nucleo_id uuid references nucleos(id)
    on delete cascade,

  slug text unique not null,

  ativo boolean not null default true,

  created_at timestamptz not null default now(),
  expires_at timestamptz
);


-- ============================================
-- 7. ÍNDICES
-- ============================================

create index if not exists idx_membros_nucleo
  on membros(nucleo_id);

create index if not exists idx_comunidades_nucleo
  on comunidades(nucleo_id);

create index if not exists idx_acoes_nucleo
  on acoes(nucleo_id);

create index if not exists idx_acoes_comunidade
  on acoes(comunidade_id);

create index if not exists idx_scout_nucleo
  on scout_registros(nucleo_id);

create index if not exists idx_scout_comunidade
  on scout_registros(comunidade_id);

create index if not exists idx_convites_nucleo
  on convites(nucleo_id);


-- ============================================
-- FIM DO SCHEMA CRC.SCOUT
-- ============================================

-- ============================================
-- 7. GESTORES DO SCOUT
-- ============================================

create table if not exists gestores (
  id uuid primary key references auth.users(id)
    on delete cascade,

  nome text,
  whatsapp text unique not null,

  status text not null default 'ativo'
    check (status in ('ativo', 'inativo', 'pendente')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- 8. ÍNDICE
-- ============================================

create index if not exists idx_gestores_whatsapp
  on gestores(whatsapp);


-- ============================================
-- 9. SEGURANÇA DOS GESTORES
-- ============================================

alter table gestores enable row level security;