-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- Creates the visits table and the public bucket used for bar photos.

create table if not exists public.visits (
  bar_id        text primary key,
  visited       boolean not null default true,
  visited_on    date,
  beer_price    numeric(5, 2),
  note          text,
  vote_ines     smallint check (vote_ines between 1 and 5),
  vote_fabienne smallint check (vote_fabienne between 1 and 5),
  photo_path    text,
  updated_at    timestamptz not null default now()
);

-- Bars discovered along the way, added from the app. The original 100 stay in
-- src/data/bars.json and are never written to; keeping the additions in their
-- own table is what lets the "x de 100" progress count keep its meaning.
-- Ids are prefixed with 'x-' so they can never collide with an original slug.
create table if not exists public.extra_bars (
  id         text primary key,
  name       text not null,
  lat        double precision not null,
  lng        double precision not null,
  created_at timestamptz not null default now()
);

-- The app only ever talks to these tables from the server using the service_role
-- key, which bypasses row level security. RLS is left on with no policies so
-- the public anon key grants no access at all.
alter table public.visits enable row level security;
alter table public.extra_bars enable row level security;

-- Public bucket: photos are readable by URL, writes still go through the server.
insert into storage.buckets (id, name, public)
values ('bar-photos', 'bar-photos', true)
on conflict (id) do update set public = true;
