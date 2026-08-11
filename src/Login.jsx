import React, { useState } from "react";
import { ChefHat, LogIn, UserPlus, Loader2 } from "lucide-react";
import { C, SANS, SERIF, s } from "./styles.js";
import { loggInn, registrer, gyldigBrukernavn } from "./lib/auth.js";

export default function Login() {
  const [modus, setModus] = useState("logg-inn");
  const [brukernavn, setBrukernavn] = useState("");
  const [passord, setPassord] = useState("");
  const [passord2, setPassord2] = useState("");
  const [feil, setFeil] = useState(null);
  const [jobber, setJobber] = useState(false);

  const nyBruker = modus === "ny-bruker";

  const send = async () => {
    setFeil(null);
    const n = brukernavn.trim();
    if (!n || !passord) return setFeil("Fyll inn brukernavn og passord");

    if (nyBruker) {
      if (!gyldigBrukernavn(n))
        return setFeil("Brukernavn: 3-24 tegn, kun bokstaver, tall, punktum, bindestrek");
      if (passord.length < 6) return setFeil("Passordet må ha minst 6 tegn");
      if (passord !== passord2) return setFeil("Passordene er ikke like");
    }

    setJobber(true);
    try {
      if (nyBruker) await registrer(n, passord);
      else await loggInn(n, passord);
    } catch (e) {
      setFeil(e.message);
    } finally {
      setJobber(false);
    }
  };

  const bytt = () => {
    setModus(nyBruker ? "logg-inn" : "ny-bruker");
    setFeil(null);
    setPassord2("");
  };

  return (
    <div style={{ ...s.page, alignItems: "center" }}>
      <div style={{ ...s.container, maxWidth: "380px", gap: "18px" }}>
        <header style={s.header}>
          <div style={s.eyebrow}>
            <ChefHat size={14} strokeWidth={2.2} />
            <span>Hva blir det til middag?</span>
          </div>
          <h1 style={s.title}>Middagsrulett</h1>
        </header>

        <div style={s.panel}>
          <h2 style={s.sectionTitle}>{nyBruker ? "Ny bruker" : "Logg inn"}</h2>

          <input
            className="drr-input"
            value={brukernavn}
            onChange={(e) => setBrukernavn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Brukernavn"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            style={{ ...s.input, width: "100%" }}
          />
          <input
            className="drr-input"
            type="password"
            value={passord}
            onChange={(e) => setPassord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Passord"
            autoComplete={nyBruker ? "new-password" : "current-password"}
            style={{ ...s.input, width: "100%" }}
          />
          {nyBruker && (
            <input
              className="drr-input"
              type="password"
              value={passord2}
              onChange={(e) => setPassord2(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Gjenta passord"
              autoComplete="new-password"
              style={{ ...s.input, width: "100%" }}
            />
          )}

          {feil && <p style={{ ...s.muted, color: C.terra, fontSize: "12.5px", margin: 0 }}>{feil}</p>}

          <button onClick={send} disabled={jobber} style={{ ...s.btnPrimary, width: "100%" }}>
            {jobber ? (
              <Loader2 size={16} className="drr-spin-icon" />
            ) : nyBruker ? (
              <UserPlus size={16} strokeWidth={2.2} />
            ) : (
              <LogIn size={16} strokeWidth={2.2} />
            )}
            {jobber ? "Vent litt…" : nyBruker ? "Opprett bruker" : "Logg inn"}
          </button>

          <button onClick={bytt} style={{ ...s.btnGhost, width: "100%" }}>
            {nyBruker ? "Har du bruker allerede? Logg inn" : "Ny her? Opprett bruker"}
          </button>
        </div>

        <p style={{ ...s.muted, fontSize: "11.5px", color: C.dim, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          Uten e-post finnes ingen «glemt passord». Velg noe du husker.
        </p>
      </div>
    </div>
  );
}
