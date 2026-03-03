import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function getStartupChecklistProgress(userEmail?: string | null) {
  if (!userEmail || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("startup_checklist_progress")
    .select("item_key")
    .eq("user_email", userEmail);

  if (error) {
    return [];
  }

  return (data ?? [])
    .map((row) => row.item_key)
    .filter((itemKey): itemKey is string => typeof itemKey === "string" && itemKey.length > 0);
}
