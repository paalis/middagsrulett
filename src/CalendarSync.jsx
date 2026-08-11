import React, { useState } from "react";
import { CalendarCheck, Copy, Check, Download, ChevronDown } from "lucide-react";
import { C, SANS, s } from "./styles.js";

const HOST = typeof window !== "undefined" ? window.location.host : "middagsrulett.vercel.app";

export default function CalendarSync({ token }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const sti = `/middagsplan.ics?t=${token || ""}`;
  const HTTPS_URL = `https://${HOST}${sti}`;
  const WEBCAL_URL = `webcal://${HOST}${sti}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(HTTPS_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Kopier lenken:", HTTPS_URL);
    }
  };

  return (
    <div style={y.wrap}>
      <button onClick={() => setOpen((v) => !v)} style={y.head}>
        <CalendarCheck size={16} strokeWidth={2.2} color={C.gold} />
        <span style={{ flex: 1, textAlign: "left" }}>Synk til telefonens kalender</span>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
        />
      </button>

      {open && (
        <div style={y.body}>
          <p style={y.lead}>
            Abonner en gang, så dukker middagene opp som en egen kalender som oppdaterer seg selv.
          </p>

          <a href={WEBCAL_URL} style={{ ...s.btnGreen, textDecoration: "none", width: "100%" }}>
            <CalendarCheck size={15} strokeWidth={2.2} />
            Abonner på iPhone
          </a>

          <div style={y.divider} />

          <div style={y.stepLabel}>Virker ikke knappen?</div>
          <ol style={y.steps}>
            <li>Kopier lenken under</li>
            <li>Innstillinger, Apper, Kalender, Kontoer</li>
            <li>Legg til konto, Annet, Legg til abonnert kalender</li>
            <li>Lim inn lenken</li>
          </ol>

          <div style={y.urlRow}>
            <code style={y.url}>{HTTPS_URL}</code>
            <button onClick={copy} style={{ ...s.iconBtn, color: copied ? C.green : C.muted }}>
              {copied ? <Check size={16} strokeWidth={2.6} /> : <Copy size={15} strokeWidth={2.2} />}
            </button>
          </div>

          <a
            href={HTTPS_URL}
            download="middagsplan.ics"
            style={{ ...s.btnGhost, width: "100%", textDecoration: "none" }}
          >
            <Download size={14} strokeWidth={2.2} />
            Last ned som fil (engangsimport)
          </a>

          <p style={y.note}>
            Hvor ofte kalenderen henter nye endringer styres i Innstillinger, Apper, Kalender,
            Kontoer, Hent nye data. Lenken er hemmelig og viser kun deres egen plan.
          </p>
        </div>
      )}
    </div>
  );
}

const y = {
  wrap: {
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: "14px",
    overflow: "hidden",
  },
  head: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "transparent",
    border: "none",
    padding: "13px 14px",
    color: C.cream,
    fontFamily: SANS,
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
  },
  body: { padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: "10px" },
  lead: { ...s.muted, fontSize: "12.5px", margin: 0, lineHeight: 1.5 },
  divider: { height: "1px", background: C.border, margin: "2px 0" },
  stepLabel: {
    fontSize: "11px",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: C.gold,
  },
  steps: { margin: 0, paddingLeft: "18px", color: C.muted, fontSize: "12.5px", lineHeight: 1.7 },
  urlRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "9px",
    padding: "8px 8px 8px 11px",
  },
  url: {
    flex: 1,
    minWidth: 0,
    color: C.cream,
    fontSize: "11.5px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  note: { ...s.muted, fontSize: "11.5px", color: C.dim, margin: 0, lineHeight: 1.5 },
};
