import { supabase } from "./supabase.js";

const BUCKET = "rettbilder";

// Laster opp en ferdig behandlet blob og returnerer offentlig URL
export const lastOppBlob = async (rettId, blob) => {
  const sti = `${rettId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(sti, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(sti);
  return data.publicUrl;
};

// Rydder bort filen fra lagringen naar bildet byttes eller fjernes
export const slettBilde = async (bildeUrl) => {
  if (!bildeUrl || !bildeUrl.includes(`/${BUCKET}/`)) return;
  const sti = bildeUrl.split(`/${BUCKET}/`)[1];
  if (!sti) return;
  await supabase.storage.from(BUCKET).remove([sti]);
};
