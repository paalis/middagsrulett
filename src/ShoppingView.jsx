import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, RotateCcw, ShoppingCart, Copy, Share2 } from "lucide-react";
import { C, SANS, SERIF, s } from "./styles.js";
import { mondayOf, addDays, toISO, dateLabel, weekNumber } from "./lib/dates.js";
import { playCheck } from "./lib/sound.js";

export default function ShoppingView({ retter, ingredienser, planlagt }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekISO = days.map(toISO);
  const weekKey = weekISO.join(",");

  const rettById = useMemo(() => {
    const m = {};
    retter.forEach((r) => { m[r.id] = r; });
    return m;
  }, [retter]);

  const list = useMemo(() => {
    const ids = planlagt.filter((x) => weekISO.includes(x.dato)).map((x) => x.rett_id);
    const groups = {};
    ids.forEach((rid) => {
      ingredienser
        .filter((ing) => ing.rett_id === rid)
        .forEach((ing) => {
          const key = ing.navn.trim().toLowerCase();
          if (!groups[key]) groups[key] = { navn: ing.navn.trim(), mengder: [], retter: new Set() };
          if (ing.mengde && ing.mengde.trim()) groups[key].mengder.push(ing.mengde.trim());
          const r = rettById[rid];
          if (r) groups[key].retter.add(r.name);
        });
    });
    return Object.entries(groups)
      .map(([key, g]) => ({ key, navn: g.navn, mengder: g.mengder, retter: Array.from(g.retter) }))
      .sort((a, b) => a.navn.localeCompare(b.navn, "nb"));
  }, [planlagt, ingredienser, rettById, weekKey]);

  const plannedCount = planlagt.filter((x) => weekISO.includes(x.dato)).length;

  const missingRecipes = useMemo(() => {
    const ids = new Set(planlagt.filter((x) => weekISO.includes(x.dato)).map((x) => x.rett_id));
    return Array.from(ids)
      .filter((id) => !ingredienser.some((ing) => ing.rett_id === id))
      .map((id) => rettById[id]?.name)
      .filter(Boolean);
  }, [planlagt, ingredienser, rettById, weekKey]);

  const toggle = (key) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) playCheck();
      return next;
    });
  };

  const doneCount = list.filter((i) => checked[i.key]).length;

  const listText = () =>
    list
      .map((item) => `${item.mengder.length > 0 ? `${item.mengder.join(" + ")} ` : ""}${item.navn}`)
      .join("\n");

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(listText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable or denied; ignore silently.
    }
  };

  const shareList = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Handleliste uke ${weekNumber(weekStart)}`, text: listText() });
      } catch {
        // User cancelled sharing or it failed; ignore silently.
      }
    } else {
      copyList();
    }
  };

  return (
    <div style={s.panel}>
      <div style={h.nav}>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Forrige uke" style={s.iconBtn}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={h.weekLabel}>Uke {weekNumber(weekStart)}</div>
          <div style={{ ...s.muted, fontSize: "12px" }}>
            {dateLabel(days[0])} - {dateLabel(days[6])}
          </div>
        </div>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Neste uke" style={s.iconBtn}>
          <ChevronRight size={20} strokeWidth={2.2} />
        </button>
      </div>

      {plannedCount === 0 ? (
        <p style={s.empty}>
          Ingen middager planlagt denne uka. Legg til noen i Plan-fanen, så fylles handlelista
          automatisk.
        </p>
      ) : list.length === 0 ? (
        <p style={s.empty}>
          {plannedCount} middag{plannedCount === 1 ? "" : "er"} planlagt, men ingen av dem har
          ingredienser lagt inn enda.
        </p>
      ) : (
        <>
          <div style={h.summary}>
            <ShoppingCart size={15} strokeWidth={2.2} />
            <span style={{ flex: 1 }}>{doneCount} av {list.length} varer</span>
            <button onClick={copyList} style={{ ...s.btnGhost, padding: "5px 11px", fontSize: "12px" }}>
              {copied ? <Check size={13} strokeWidth={2.2} /> : <Copy size={13} strokeWidth={2.2} />}
              {copied ? "Kopiert" : "Kopier"}
            </button>
            <button onClick={shareList} style={{ ...s.btnGhost, padding: "5px 11px", fontSize: "12px" }}>
              <Share2 size={13} strokeWidth={2.2} />
              Del
            </button>
            {doneCount > 0 && (
              <button onClick={() => setChecked({})} style={{ ...s.btnGhost, padding: "5px 11px", fontSize: "12px" }}>
                <RotateCcw size={13} strokeWidth={2.2} />
                Nullstill
              </button>
            )}
          </div>

          <ul style={h.list}>
            {list.map((item) => {
              const done = !!checked[item.key];
              return (
                <li key={item.key}>
                  <button onClick={() => toggle(item.key)} style={h.itemBtn}>
                    <span
                      style={{
                        ...h.box,
                        background: done ? C.green : "transparent",
                        borderColor: done ? C.green : C.border,
                      }}
                    >
                      {done && <Check size={13} strokeWidth={3} color={C.bg} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <span
                        style={{
                          ...h.itemName,
                          textDecoration: done ? "line-through" : "none",
                          opacity: done ? 0.45 : 1,
                        }}
                      >
                        {item.navn}
                      </span>
                      {item.mengder.length > 0 && (
                        <span style={{ ...h.itemMeta, opacity: done ? 0.35 : 1 }}>
                          {item.mengder.join(" + ")}
                        </span>
                      )}
                      <span style={{ ...h.itemFrom, opacity: done ? 0.3 : 1 }}>
                        {item.retter.join(", ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {missingRecipes.length > 0 && (
        <p style={{ ...s.muted, fontSize: "12px", color: C.dim, borderTop: `1px solid ${C.border}`, paddingTop: "10px", margin: 0 }}>
          Mangler ingredienser: {missingRecipes.join(", ")}
        </p>
      )}
    </div>
  );
}

const h = {
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  weekLabel: { fontFamily: SERIF, fontWeight: 700, fontSize: "18px", color: C.cream },
  summary: { display: "flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "13px", fontWeight: 500 },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" },
  itemBtn: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    padding: "9px 6px",
    cursor: "pointer",
    fontFamily: SANS,
  },
  box: {
    width: "19px",
    height: "19px",
    borderRadius: "5px",
    border: "1.5px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "1px",
    transition: "background 0.12s ease, border-color 0.12s ease",
  },
  itemName: { display: "block", color: C.cream, fontSize: "14px", fontWeight: 500 },
  itemMeta: { display: "block", color: C.gold, fontSize: "12px", marginTop: "1px" },
  itemFrom: { display: "block", color: C.dim, fontSize: "11.5px", marginTop: "1px" },
};
