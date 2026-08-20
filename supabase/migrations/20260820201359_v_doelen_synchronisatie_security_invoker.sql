/*
  Een view draait standaard met de rechten van wie hem aanmaakte, waardoor de
  RLS van de opvragende gebruiker omzeild wordt. Deze view leest alleen
  educational_goals en minimumdoelen, allebei leesbaar voor authenticated, maar
  het is beter dat de view dat zelf niet bepaalt. Met security_invoker gelden de
  rechten van wie de view bevraagt — zoals elders in dit project ook gebeurt.
*/
alter view public.v_doelen_synchronisatie set (security_invoker = true);
