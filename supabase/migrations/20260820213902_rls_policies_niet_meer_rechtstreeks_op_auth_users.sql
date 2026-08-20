/*
  # RLS-policies lazen rechtstreeks uit auth.users

  Vier policies bevatten een subquery van de vorm

    exists (select 1 from admin_users au
            where au.email = (select users.email from auth.users where users.id = auth.uid()))

  Een policy wordt uitgevoerd met de rechten van wie de query stelt, en de rol
  authenticated heeft geen SELECT op auth.users. Postgres breekt dan af met
  "permission denied for table users" (42501) — ongeacht of de gebruiker admin
  is, want de voorwaarde zelf kan al niet berekend worden.

  Gevolg: elke SELECT op educational_videos faalde voor iedere leerkracht, dus
  het hele tabblad Kijk deed het niet, en een video toevoegen evenmin — de
  insert doet .select() erachteraan en die valt over dezelfde policy.
  Nagespeeld als rol authenticated: "SELECT faalt: permission denied for table
  users". Na deze migratie: werkt.

  is_current_user_admin() doet exact dezelfde controle, maar dan als SECURITY
  DEFINER en via auth.email() in plaats van een tabel te lezen. Die functie
  bestond al en wordt elders in dit schema ook gebruikt.
*/

drop policy if exists "admin_select_educational_videos" on public.educational_videos;
create policy "admin_select_educational_videos"
  on public.educational_videos for select to authenticated
  using (public.is_current_user_admin());

drop policy if exists "insert_video_vocabulary" on public.educational_video_vocabulary;
create policy "insert_video_vocabulary"
  on public.educational_video_vocabulary for insert to authenticated
  with check (
    exists (
      select 1 from public.school_teammembers st
      where st.user_id = auth.uid() and st.role = 'admin' and st.is_active = true
    )
    or public.is_current_user_admin()
  );

drop policy if exists "update_video_vocabulary" on public.educational_video_vocabulary;
create policy "update_video_vocabulary"
  on public.educational_video_vocabulary for update to authenticated
  using (
    exists (
      select 1 from public.school_teammembers st
      where st.user_id = auth.uid() and st.role = 'admin' and st.is_active = true
    )
    or public.is_current_user_admin()
  )
  with check (
    exists (
      select 1 from public.school_teammembers st
      where st.user_id = auth.uid() and st.role = 'admin' and st.is_active = true
    )
    or public.is_current_user_admin()
  );

drop policy if exists "delete_video_vocabulary" on public.educational_video_vocabulary;
create policy "delete_video_vocabulary"
  on public.educational_video_vocabulary for delete to authenticated
  using (
    exists (
      select 1 from public.school_teammembers st
      where st.user_id = auth.uid() and st.role = 'admin' and st.is_active = true
    )
    or public.is_current_user_admin()
  );
