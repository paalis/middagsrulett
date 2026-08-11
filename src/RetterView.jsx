import React, { useState } from "react";
import { Plus, X, BookOpen, Search, ImageIcon } from "lucide-react";
import { C, WHEEL_COLORS, SANS, s } from "./styles.js";

const FILTERS = [["alle", "Alle"], ["hverdag", "Hverdag"], ["helg", "Helg"]];

export default function RetterView({
  retter, ingredienser, onAdd, onCycleCategory, onRemove, onOpenRecipe,
}) {
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("begge");
  const [filter, setFilter] = useState("alle");
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const add = async () => {
    const name = newItem.trim();
    if (!name) return;
    setNewItem("");
    await onAdd(name, newCategory);
  };

  const visible = retter.filter((r) => {
    const matchFilter = filter === "alle" || r.kategori === "begge" || r.kategori === filter;
    const matchQuery = !query.trim() || r.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchFilter && matchQuery;
  });

  const counts = {
    hverdag: retter.filter((r) => r.kategori === "hverdag" || r.kategori === "begge").length,
    helg: retter.filter((r) => r.kategori === "helg" || r.kategori === "begge").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={s.panel}>
        <h2 style={s.sectionTitle}>Ny rett</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            className="drr-input"
            value={newItem}
            onChange={(ev) => setNewItem(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Enter" && add()}
            placeholder="F.eks. Tacosuppe, laks i ovn, pizza"
            style={s.input}
          />
          <button onClick={add} style={s.btnGreen}>
            <Plus size={18} strokeWidth={2.4} />
            Legg til
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ ...s.muted, fontSize: "12.5px" }}>Passer til:</span>
          {[["hverdag", "Hverdag"], ["helg", "Helg"], ["begge", "Begge"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setNewCategory(v)}
              style={{
                ...chipBtn,
                ...(newCategory === v
                  ? { borderColor: C.green, color: C.cream, background: C.panelAlt }
                  : {}),
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={s.panel}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={s.sectionTitle}>
            Alle retter <span style={{ color: C.dim, fontSize: "14px" }}>({retter.length})</span>
          </h2>
          <span style={{ ...s.muted, fontSize: "11.5px", color: C.dim }}>
            {counts.hverdag} hverdag / {counts.helg} helg
          </span>
        </div>

        {retter.length > 4 && (
          <div style={searchWrap}>
            <Search size={15} strokeWidth={2.2} color={C.muted} />
            <input
              className="drr-input"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Søk"
              style={{ ...s.input, border: "none", background: "transparent", padding: "8px 0" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "6px" }}>
          {FILTERS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                ...chipBtn,
                ...(filter === v
                  ? { borderColor: C.orange, color: C.cream, background: C.panelAlt }
                  : {}),
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {retter.length === 0 ? (
          <p style={s.empty}>Ingen retter enda. Legg inn den første middagsideen over.</p>
        ) : visible.length === 0 ? (
          <p style={s.empty}>Ingen retter passer søket.</p>
        ) : (
          <ul style={rowList}>
            {visible.map((r) => {
              const colorIdx = retter.findIndex((x) => x.id === r.id);
              const color = WHEEL_COLORS[colorIdx % WHEEL_COLORS.length];
              const ingCount = ingredienser.filter((x) => x.rett_id === r.id).length;
              const confirming = confirmId === r.id;

              return (
                <li key={r.id} style={{ ...row, borderLeftColor: color }}>
                  <button
                    onClick={() => onOpenRecipe(r.id)}
                    aria-label={`Bilde og oppskrift for ${r.name}`}
                    style={{ ...thumbBtn, borderColor: color }}
                  >
                    {r.bilde_url ? (
                      <img
                        src={r.bilde_url}
                        alt=""
                        style={thumbImg}
                        loading="lazy"
                        onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <ImageIcon size={16} strokeWidth={2} color={C.dim} />
                    )}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={rowName}>{r.name}</div>
                    <div style={rowMeta}>
                      <button
                        onClick={() => onCycleCategory(r)}
                        style={{ ...catTag, borderColor: color, color: C.cream }}
                        title="Trykk for å endre kategori"
                      >
                        {r.kategori === "hverdag"
                          ? "Hverdag"
                          : r.kategori === "helg"
                          ? "Helg"
                          : "Begge"}
                      </button>
                      <span style={{ color: ingCount > 0 ? C.gold : C.dim, fontSize: "11.5px" }}>
                        {ingCount > 0 ? `${ingCount} ingredienser` : "ingen oppskrift"}
                      </span>
                    </div>
                  </div>

                  {confirming ? (
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <button
                        onClick={() => { onRemove(r.id); setConfirmId(null); }}
                        style={{ ...chipBtn, borderColor: C.terra, color: C.terra }}
                      >
                        Slett
                      </button>
                      <button onClick={() => setConfirmId(null)} style={chipBtn}>Avbryt</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button
                        onClick={() => onOpenRecipe(r.id)}
                        aria-label={`Oppskrift for ${r.name}`}
                        style={{ ...s.iconBtn, color: ingCount > 0 ? C.gold : C.muted }}
                      >
                        <BookOpen size={17} strokeWidth={2.2} />
                      </button>
                      <button
                        onClick={() => setConfirmId(r.id)}
                        aria-label={`Fjern ${r.name}`}
                        style={s.iconBtn}
                      >
                        <X size={17} strokeWidth={2.4} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

const chipBtn = {
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: "999px",
  padding: "5px 13px",
  fontFamily: SANS,
  fontWeight: 500,
  fontSize: "12.5px",
  color: C.muted,
  cursor: "pointer",
};

const searchWrap = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: "10px",
  padding: "0 12px",
};

const rowList = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" };

const row = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderLeft: "3px solid",
  borderRadius: "10px",
  padding: "10px 8px 10px 10px",
};

const thumbBtn = {
  width: "44px",
  height: "44px",
  flexShrink: 0,
  borderRadius: "9px",
  border: "1px solid",
  background: C.panelAlt,
  padding: 0,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const thumbImg = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

const rowName = { color: C.cream, fontSize: "14.5px", fontWeight: 500 };
const rowMeta = { display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" };
const catTag = {
  background: "transparent",
  border: "1px solid",
  borderRadius: "999px",
  padding: "2px 9px",
  fontFamily: SANS,
  fontSize: "11px",
  fontWeight: 500,
  cursor: "pointer",
};
