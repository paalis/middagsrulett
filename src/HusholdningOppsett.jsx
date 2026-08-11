import React, { useState } from "react";
import { Home, Users, Loader2, LogOut } from "lucide-react";
import { C, SANS, s } from "./styles.js";
import { opprettHusholdning, bliMed, loggUt } from "./lib/auth.js";

export default function HusholdningOppsett({ brukernavn, onFerdig }) {
  const [valg, setValg] = useState(null);
  const [navn, setNavn] = useState("");
  const [kode, setKode] = useState("");
  const [feil, setFeil] = useState(null);
  const [jobber, setJobber] = useState(false);

  const utfor = async () => {
    setFeil(null);
    setJobber(true);
    try {
      if (valg === "ny") await opprettHusholdning(navn);
      else await bliMed(kode);
      await onFerdig();
    } catch (e) {
      setFeil(e.message);
    } finally {
      setJobber(false);
    }
  };

  return (
    <div style={{ ...s.page, alignItems: "center" }}>
      <div style={{ ...s.container, maxWidth: "400px", gap: "18px" }}>
        <header style={s.header}>
          <h1 style={{ ...s.title, fontSize: "28px" }}>Hei, {brukernavn}!</h1>
          <p style={s.subtitle}>
            En husholdning er de som deler retter og middagsplan. Start din egen, eller bli med i
            en som finnes.
          </p>
        </header>

        <div style={s.panel}>
          <button
            onClick={() => { setValg("ny"); setFeil(null); }}
            style={{ ...kort, ...(valg === "ny" ? valgt : {}) }}
          >
            <Home size={18} strokeWidth={2.2} color={valg === "ny" ? C.cream : C.muted} />
            <span style={{ textAlign: "left" }}>
              <span style={kortTittel}>Start ny husholdning</span>
              <span style={kortTekst}>Du begynner med blanke ark</span>
            </span>
          </button>

          {valg === "ny" && (
            <input
              className="drr-input"
              value={navn}
              onChange={(e) => setNavn(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && utfor()}
              placeholder="Navn, f.eks. Hjemme hos oss"
              style={{ ...s.input, width: "100%" }}
            />
          )}

          <button
            onClick={() => { setValg("bli-med"); setFeil(null); }}
            style={{ ...kort, ...(valg === "bli-med" ? valgt : {}) }}
          >
            <Users size={18} strokeWidth={2.2} color={valg === "bli-med" ? C.cream : C.muted} />
            <span style={{ textAlign: "left" }}>
              <span style={kortTittel}>Bli med i en husholdning</span>
              <span style={kortTekst}>Du trenger koden fra noen som er der</span>
            </span>
          </button>

          {valg === "bli-med" && (
            <input
              className="drr-input"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && utfor()}
              placeholder="Kode, f.eks. A3A51E"
              autoCapitalize="characters"
              autoCorrect="off"
              style={{ ...s.input, width: "100%", letterSpacing: "0.12em", fontWeight: 600 }}
            />
          )}

          {feil && <p style={{ ...s.muted, color: C.terra, fontSize: "12.5px", margin: 0 }}>{feil}</p>}

          {valg && (
            <button onClick={utfor} disabled={jobber} style={{ ...s.btnPrimary, width: "100%" }}>
              {jobber && <Loader2 size={16} className="drr-spin-icon" />}
              {jobber ? "Vent litt…" : valg === "ny" ? "Opprett" : "Bli med"}
            </button>
          )}
        </div>

        <button onClick={loggUt} style={{ ...s.btnGhost, alignSelf: "center" }}>
          <LogOut size={14} strokeWidth={2.2} />
          Logg ut
        </button>
      </div>
    </div>
  );
}

const kort = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: "12px",
  padding: "13px 14px",
  cursor: "pointer",
  fontFamily: SANS,
};
const valgt = { borderColor: C.orange, background: C.panelAlt };
const kortTittel = { display: "block", color: C.cream, fontSize: "14px", fontWeight: 600 };
const kortTekst = { display: "block", color: C.dim, fontSize: "12px", marginTop: "2px" };
