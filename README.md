# Menorca Wind 🌊

App para consultar qué playas de Menorca visitar según la dirección del viento.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase (registro de consultas + stats admin)
- Open-Meteo API (previsión gratuita, sin API key)
- Vercel (despliegue)

## Setup Supabase — SQL a ejecutar

```sql
create table consultas (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  fecha_consulta date not null,
  wind_direction text,
  is_rainy boolean default false,
  device_type text,
  os text,
  browser text,
  user_agent text,
  ip text
);
alter table consultas enable row level security;
create policy "insert_only" on consultas for insert with check (true);
create policy "select_all" on consultas for select using (true);
```

## Variables de entorno (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ADMIN_PASSWORD=Bini_3668


```

## Despliegue Vercel
1. `git push` al repo GitHub `menorca-wind`
2. Importar en Vercel
3. Añadir las 3 variables de entorno
4. Deploy automático
