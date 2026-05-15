create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_role public.app_role;
  v_username text;
  v_display_name text;
  v_email_prefix text;
  v_base_username text;
  v_attempt int := 0;
begin
  -- Resolve role with safe default
  begin
    v_role := coalesce(
      nullif(new.raw_user_meta_data->>'role', '')::public.app_role,
      'customer'::public.app_role
    );
  exception when others then
    v_role := 'customer'::public.app_role;
  end;

  -- Email prefix fallback (handles null email too)
  v_email_prefix := coalesce(
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );

  -- Sanitize: only [a-zA-Z0-9_], 2-30 chars
  v_base_username := coalesce(
    nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'username', ''), '[^a-zA-Z0-9_]', '', 'g'), ''),
    regexp_replace(v_email_prefix, '[^a-zA-Z0-9_]', '', 'g'),
    'user'
  );

  if length(v_base_username) < 2 then
    v_base_username := v_base_username || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  if length(v_base_username) > 24 then
    v_base_username := substr(v_base_username, 1, 24);
  end if;

  v_username := v_base_username;

  -- Resolve username collisions by appending a suffix
  while exists (select 1 from public.profiles where username = v_username) and v_attempt < 5 loop
    v_attempt := v_attempt + 1;
    v_username := v_base_username || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end loop;

  v_display_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    v_username
  );

  begin
    insert into public.profiles (id, username, display_name, role)
    values (new.id, v_username, v_display_name, v_role)
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: failed to insert profile for %: %', new.id, sqlerrm;
  end;

  begin
    insert into public.user_roles (user_id, role)
    values (new.id, v_role)
    on conflict (user_id, role) do nothing;
  exception when others then
    raise warning 'handle_new_user: failed to insert user_role for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$function$;

-- Ensure the trigger is attached
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();