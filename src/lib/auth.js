import { supabase } from "./supabase.js";

// Supabase krever en e-postadresse, og validerer at domenet ser ekte ut.
// Brukeren forholder seg bare til brukernavn; vi lager adressen bak kulissene.
// Flere kandidater fordi Supabase avviser domener den ikke godtar.
const DOMENER = ["middagsrulett.vercel.app", "example.com", "gmail.com"];

const rensk = (n) => n.trim().toLowerCase().replace(/\s+/g, "");
export const tilEpost = (brukernavn, domene = DOMENER[0]) => `${rensk(brukernavn)}@${domene}`;
export const gyldigBrukernavn = (n) => /^[a-zA-Z0-9._-]{3,24}$/.test(n.trim());

const erUgyldigDomene = (melding = "") =>
  /invalid|not valid|unable to validate/i.test(melding) && /email|address/i.test(melding);

export const loggInn = async (brukernavn, passord) => {
  for (const domene of DOMENER) {
    const { error } = await supabase.auth.signInWithPassword({
      email: tilEpost(brukernavn, domene),
      password: passord,
    });
    if (!error) return;
    if (!erUgyldigDomene(error.message) && !/invalid login/i.test(error.message)) break;
  }
  throw new Error("Feil brukernavn eller passord");
};

export const registrer = async (brukernavn, passord) => {
  const navn = brukernavn.trim();
  const { data: ledig } = await supabase.rpc("brukernavn_ledig", { p_navn: navn });
  if (ledig === false) throw new Error("Brukernavnet er opptatt");

  let sisteFeil = null;
  for (const domene of DOMENER) {
    const { data, error } = await supabase.auth.signUp({
      email: tilEpost(navn, domene),
      password: passord,
    });

    if (error) {
      if (/already registered|already been registered/i.test(error.message))
        throw new Error("Brukernavnet er opptatt");
      sisteFeil = error;
      if (erUgyldigDomene(error.message)) continue;
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error(
        "Brukeren ble opprettet, men innlogging krever bekreftelse. Skru av «Confirm email» i Supabase."
      );
    }

    const { error: pErr } = await supabase
      .from("profiler")
      .insert({ id: data.user.id, brukernavn: navn });
    if (pErr && !/duplicate/i.test(pErr.message))
      throw new Error("Klarte ikke å opprette profil");
    return;
  }

  throw new Error(sisteFeil ? sisteFeil.message : "Klarte ikke å opprette bruker");
};

export const loggUt = () => supabase.auth.signOut();

export const hentProfil = async () => {
  const { data, error } = await supabase
    .from("profiler")
    .select("id, brukernavn, husholdning_id")
    .maybeSingle();
  if (error) return null;
  return data;
};

export const hentHusholdning = async () => {
  const { data } = await supabase
    .from("husholdninger")
    .select("id, navn, kode, kalender_token")
    .maybeSingle();
  return data || null;
};

export const opprettHusholdning = async (navn) => {
  const { error } = await supabase.rpc("opprett_husholdning", { p_navn: navn });
  if (error) throw new Error("Klarte ikke å opprette husholdning");
};

export const bliMed = async (kode) => {
  const { error } = await supabase.rpc("bli_med_husholdning", { p_kode: kode });
  if (error) throw new Error("Fant ingen husholdning med den koden");
};
