-- MOCKUP ONLY – NOT EXECUTED. After-photos bucket for Maya Gym.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gym-photos','gym-photos', false, 524288, array['image/jpeg']) on conflict (id) do nothing;
-- objects stored at <auth.uid()>/<workout_t>.jpg
create policy "gym photos select own" on storage.objects for select to authenticated
  using (bucket_id='gym-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "gym photos insert own" on storage.objects for insert to authenticated
  with check (bucket_id='gym-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "gym photos update own" on storage.objects for update to authenticated
  using (bucket_id='gym-photos' and (storage.foldername(name))[1]=auth.uid()::text)
  with check (bucket_id='gym-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "gym photos delete own" on storage.objects for delete to authenticated
  using (bucket_id='gym-photos' and (storage.foldername(name))[1]=auth.uid()::text);
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.buckets to authenticated;
revoke all on storage.objects from anon;
