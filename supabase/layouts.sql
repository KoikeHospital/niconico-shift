-- 店前配置ツール Phase 3（保存だけ）用テーブル。
-- Supabase の SQL Editor でそのまま実行してください。
-- 既存の shifts / attendance と同様、anon キーからの読み書きを許可する社内ツール前提。

create table if not exists public.layouts (
  id uuid primary key default gen_random_uuid(),
  -- 対象日（翌朝の出庫日）。YYYY-MM-DD。
  date date not null,
  -- 任意メモ（担当者名など）。
  label text,
  -- 配置スナップショット（SavedLayout。lanes / pullOrder / overflow / warnings）。
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- 日付・作成日時での並び替え/絞り込みを速くする。
create index if not exists layouts_date_idx on public.layouts (date desc);
create index if not exists layouts_created_at_idx on public.layouts (created_at desc);

-- RLS を有効化し、anon ロールに読み書きを許可（社内ツール運用）。
-- 公開範囲を絞る場合はこのポリシーを Supabase Auth ベースに置き換えてください。
alter table public.layouts enable row level security;

drop policy if exists "layouts anon select" on public.layouts;
create policy "layouts anon select"
  on public.layouts for select
  to anon
  using (true);

drop policy if exists "layouts anon insert" on public.layouts;
create policy "layouts anon insert"
  on public.layouts for insert
  to anon
  with check (true);

drop policy if exists "layouts anon delete" on public.layouts;
create policy "layouts anon delete"
  on public.layouts for delete
  to anon
  using (true);
