import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Save, Camera, ImageOff, Link2, Loader2 } from "lucide-react";
import { C, SANS, s } from "./styles.js";
import { lastOppBlob, slettBilde } from "./lib/bilde.js";
import BildeKutter from "./BildeKutter.jsx";

export default function RecipeEditor({
  rett, ingredienser, onClose, onSaveRecipe, onSaveBilde, onAddIngredient, onDeleteIngredient,
}) {
  const [oppskrift, setOppskrift] = useState(rett.oppskrift || "");
  const [mengde, setMengde] = useState("");
  const [navn, setNavn] = useState("");
  const [saved, setSaved] = useState(false);
  const [laster, setLaster] = useState(false);
  const [bildeFeil, setBildeFeil] = useState(null);
  const [visUrlFelt, setVisUrlFelt] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [kutterFil, setKutterFil] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setOppskrift(rett.oppskrift || "");
  }, [rett.id, rett.oppskrift]);

  const mine = ingredienser.filter((i) => i.rett_id === rett.id);

  const add = async () => {
    const n = navn.trim();
    if (!n) return;
    await onAddIngredient(rett.id, n, mengde.trim());
    setNavn("");
    setMengde("");
  };

  const save = async () => {
    await onSaveRecipe(rett.id, oppskrift);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const velgFil = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBildeFeil(null);
    setKutterFil(file);
  };

  const lastOppUtsnitt = async (blob) => {
    setKutterFil(null);
    setLaster(true);
    try {
      const gammel = rett.bilde_url;
      const url = await lastOppBlob(rett.id, blob);
      await onSaveBilde(rett.id, url);
      if (gammel) slettBilde(gammel).catch(() => {});
    } catch (err) {
      setBildeFeil("Klarte ikke å laste opp bildet. Prøv igjen.");
    } finally {
      setLaster(false);
    }
  };

  const lagreUrl = async () => {
    const u = urlInput.trim();
    if (!u) return;
    await onSaveBilde(rett.id, u);
    setUrlInput("");
    setVisUrlFelt(false);
  };

  const fjernBilde = async () => {
    const gammel = rett.bilde_url;
    await onSaveBilde(rett.id, null);
    if (gammel) slettBilde(gammel).catch(() => {});
  };

  return (
    <div style={e.overlay} onClick={onClose}>
      <div style={e.sheet} onClick={(ev) => ev.stopPropagation()}>
        <div style={e.head}>
          <h2 style={{ ...s.sectionTitle, fontSize: "21px" }}>{rett.name}</h2>
          <button onClick={onClose} aria-label="Lukk" style={s.iconBtn}>
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div style={e.body}>
          <div>
            <div style={e.label}>Bilde</div>
            {rett.bilde_url ? (
              <div style={{ position: "relative" }}>
                <img
                  src={rett.bilde_url}
                  alt={rett.name}
                  style={e.preview}
                  onError={(ev) => { ev.currentTarget.style.opacity = "0.25"; }}
                />
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={laster}
                    style={{ ...s.btnGhost, flex: 1 }}
                  >
                    {laster ? <Loader2 size={14} className="drr-spin-icon" /> : <Camera size={14} strokeWidth={2.2} />}
                    Bytt bilde
                  </button>
                  <button onClick={fjernBilde} style={{ ...s.btnGhost, color: C.terra, borderColor: C.terra }}>
                    <ImageOff size={14} strokeWidth={2.2} />
                    Fjern
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={laster}
                  style={{ ...s.btnGreen, width: "100%" }}
                >
                  {laster ? <Loader2 size={15} className="drr-spin-icon" /> : <Camera size={15} strokeWidth={2.2} />}
                  {laster ? "Laster opp…" : "Ta bilde eller velg fra galleri"}
                </button>

                {!visUrlFelt ? (
                  <button
                    onClick={() => setVisUrlFelt(true)}
                    style={{ ...s.btnGhost, width: "100%", marginTop: "6px" }}
                  >
                    <Link2 size={14} strokeWidth={2.2} />
                    eller lim inn bilde-lenke
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <input
                      className="drr-input"
                      value={urlInput}
                      onChange={(ev) => setUrlInput(ev.target.value)}
                      onKeyDown={(ev) => ev.key === "Enter" && lagreUrl()}
                      placeholder="https://"
                      style={s.input}
                    />
                    <button onClick={lagreUrl} style={s.btnGreen}>Lagre</button>
                  </div>
                )}
              </>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={velgFil}
              style={{ display: "none" }}
            />
            {bildeFeil && <p style={{ ...s.muted, color: C.terra, fontSize: "12px", margin: "8px 0 0" }}>{bildeFeil}</p>}

            {kutterFil && (
              <BildeKutter
                file={kutterFil}
                onCancel={() => setKutterFil(null)}
                onConfirm={lastOppUtsnitt}
              />
            )}
          </div>

          <div>
            <div style={e.label}>Ingredienser</div>
            {mine.length === 0 ? (
              <p style={{ ...s.muted, fontSize: "12.5px", color: C.dim, margin: "0 0 10px" }}>
                Ingen ingredienser enda. Det du legger inn her havner automatisk i handlelista når
                retten er planlagt.
              </p>
            ) : (
              <ul style={e.ingList}>
                {mine.map((ing) => (
                  <li key={ing.id} style={e.ingRow}>
                    <span style={e.ingMengde}>{ing.mengde || "-"}</span>
                    <span style={e.ingNavn}>{ing.navn}</span>
                    <button
                      onClick={() => onDeleteIngredient(ing.id)}
                      aria-label={`Slett ${ing.navn}`}
                      style={s.iconBtn}
                    >
                      <Trash2 size={14} strokeWidth={2.2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div style={e.addRow}>
              <input
                className="drr-input"
                value={mengde}
                onChange={(ev) => setMengde(ev.target.value)}
                onKeyDown={(ev) => ev.key === "Enter" && add()}
                placeholder="400 g"
                style={{ ...s.input, flex: "0 0 82px" }}
              />
              <input
                className="drr-input"
                value={navn}
                onChange={(ev) => setNavn(ev.target.value)}
                onKeyDown={(ev) => ev.key === "Enter" && add()}
                placeholder="kjøttdeig"
                style={s.input}
              />
              <button onClick={add} style={s.btnGreen} aria-label="Legg til ingrediens">
                <Plus size={17} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          <div>
            <div style={e.label}>Fremgangsmåte</div>
            <textarea
              className="drr-input"
              value={oppskrift}
              onChange={(ev) => setOppskrift(ev.target.value)}
              placeholder="1. Brun kjøttdeigen"
              style={s.textarea}
            />
            <button onClick={save} style={{ ...s.btnGreen, marginTop: "10px", width: "100%" }}>
              <Save size={15} strokeWidth={2.2} />
              {saved ? "Lagret!" : "Lagre fremgangsmåte"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const e = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(10,14,12,0.72)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 50,
  },
  sheet: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "88vh",
    background: C.panel,
    borderTop: `1px solid ${C.border}`,
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 10px",
    borderBottom: `1px solid ${C.border}`,
  },
  body: { padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "22px" },
  label: {
    fontSize: "11.5px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: C.gold,
    marginBottom: "8px",
  },
  preview: {
    width: "100%",
    aspectRatio: "3 / 2",
    objectFit: "cover",
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    display: "block",
  },
  ingList: {
    listStyle: "none",
    margin: "0 0 10px",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  ingRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "9px",
    padding: "7px 8px 7px 11px",
  },
  ingMengde: {
    color: C.gold,
    fontSize: "12.5px",
    fontWeight: 600,
    flex: "0 0 76px",
    fontVariantNumeric: "tabular-nums",
  },
  ingNavn: { color: C.cream, fontSize: "13.5px", flex: 1, minWidth: 0 },
  addRow: { display: "flex", gap: "6px" },
};
