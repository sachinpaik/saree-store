import { createClient } from "@/lib/supabase/client";
import type { AboutContent, AboutVideo } from "@/types/database";

export async function getAboutContent(): Promise<AboutContent | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("about_content")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as AboutContent;
}

export async function saveAboutContent(
  payload: Pick<AboutContent, "title" | "intro_text" | "body_html">
): Promise<{ error?: string }> {
  const supabase = createClient();
  const existing = await getAboutContent();

  if (existing?.id) {
    const { error } = await supabase
      .from("about_content")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return {};
  }

  const { error } = await supabase.from("about_content").insert(payload);
  if (error) return { error: error.message };
  return {};
}

export async function getAboutVideos(): Promise<AboutVideo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("about_videos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as AboutVideo[];
}

export async function createAboutVideo(
  payload: Omit<AboutVideo, "id" | "created_at">
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("about_videos").insert(payload);
  if (error) return { error: error.message };
  return {};
}

export async function updateAboutVideo(
  id: string,
  payload: Partial<Omit<AboutVideo, "id" | "created_at">>
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("about_videos").update(payload).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deleteAboutVideo(id: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("about_videos").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function reorderAboutVideos(idsInOrder: string[]): Promise<{ error?: string }> {
  const supabase = createClient();
  for (let i = 0; i < idsInOrder.length; i++) {
    const { error } = await supabase
      .from("about_videos")
      .update({ sort_order: i })
      .eq("id", idsInOrder[i]);
    if (error) return { error: error.message };
  }
  return {};
}
