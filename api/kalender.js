const SUPABASE_URL = "https://ujgqsxkaqvjymfwmgxqh.supabase.co";
const SUPABASE_KEY = "sb_publishable_evKQEJkFAgjt42665z_17Q_9DAxT7DC";

const esc = (str = "") =>
  String(str)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

const fold = (line) => {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let cur = "";
  let curBytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (curBytes + b > 75) { out.push(cur); cur = " " + ch; curBytes = 1 + b; }
    else { cur += ch; curBytes += b; }
  }
  if (cur) out.push(cur);
  return out.join("\r\n");
};

const ymd = (iso) => iso.replace(/-/g, "");
const addDaysISO = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10).replace(/-/g, "");
};

export default async function handler(req, res) {
  const token = (req.query?.t || "").toString().trim();
  if (!token) {
    res.status(400).send("Mangler token i lenken");
    return;
  }

  try {
    const svar = await fetch(`${SUPABASE_URL}/rest/v1/rpc/kalender_data`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_token: token }),
    });
    if (!svar.ok) throw new Error(`Supabase ${svar.status}`);
    const data = await svar.json();

    if (!data) {
      res.status(404).send("Ugyldig kalenderlenke");
      return;
    }

    const { planlagt = [], retter = [], ingredienser = [] } = data;
    const rettById = Object.fromEntries(retter.map((r) => [r.id, r]));
    const ingByRett = {};
    ingredienser.forEach((i) => { (ingByRett[i.rett_id] ||= []).push(i); });

    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Middagsrulett//NO",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Middagsplan",
      "X-WR-CALDESC:Planlagte middager fra Middagsrulett",
      "X-WR-TIMEZONE:Europe/Oslo",
      "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
      "X-PUBLISHED-TTL:PT1H",
    ];

    for (const p of planlagt) {
      const rett = rettById[p.rett_id];
      if (!rett) continue;
      const ings = ingByRett[p.rett_id] || [];
      const deler = [];
      if (ings.length) {
        deler.push(
          "Ingredienser:\n" +
            ings.map((i) => `- ${i.mengde ? i.mengde + " " : ""}${i.navn}`).join("\n")
        );
      }
      if (rett.oppskrift && rett.oppskrift.trim()) {
        deler.push("Fremgangsmate:\n" + rett.oppskrift.trim());
      }
      lines.push(
        "BEGIN:VEVENT",
        `UID:${p.id}@middagsrulett.vercel.app`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(p.dato)}`,
        `DTEND;VALUE=DATE:${addDaysISO(p.dato, 1)}`,
        fold(`SUMMARY:${esc(rett.name)}`),
        "TRANSP:TRANSPARENT",
        "CATEGORIES:Middag"
      );
      if (deler.length) lines.push(fold(`DESCRIPTION:${esc(deler.join("\n\n"))}`));
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="middagsplan.ics"');
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    res.status(200).send(lines.join("\r\n"));
  } catch {
    res.status(500).send("Kunne ikke generere kalender");
  }
}
