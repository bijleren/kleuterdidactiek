/*
  De view erft zijn rechten van het schema en stond daardoor ook voor anon open.
  Met security_invoker levert dat geen rijen op — leerplandoelen is alleen voor
  authenticated leesbaar — maar het is beter dat het recht er niet staat dan dat
  het door de RLS eronder tegengehouden moet worden.
*/
revoke all on public.v_leerdoelactiviteiten from anon;
