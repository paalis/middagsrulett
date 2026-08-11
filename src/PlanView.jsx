import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, BookOpen } from "lucide-react";
import { C, WHEEL_COLORS, SANS, SERIF, s } from "./styles.js";
import { mondayOf, addDays, toISO, dayName, dateLabel, isToday, weekNumber } from "./lib/dates.js";
import CalendarSync from "./CalendarSync.jsx";

export default function PlanView({ retter, planlagt, onPlan, onUnplan, onOpenRecipe, husholdning }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [pickerDate, setPickerDate] = useState(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDate = {};
  planlagt.forEach((p) => {
    if (!byDate[p.dato]) byDate[p.dato] = [];
    byDate[p.dato].push(p);
  });

  const rettById = {};
  retter.forEach((r, i) => { rettById[r.id] = { ...r, colorIdx: i }; });

  const shiftWeek = (n) => {
    setWeekStart(addDays(weekStart, n * 7));
    setPickerDate(null);
  };

  const choose = async (rettId) => {
    if (!pickerDate) return;
    await onPlan(pickerDate, rettId);
    setPickerDate(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={s.panel}>
        <div style={p.weekNav}>
          <button onClick={() => shiftWeek(-1)} aria-label="Forrige uke" style={s.iconBtn}>
            <ChevronLeft size={20} strokeWidth={2.2} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={p.weekLabel}>Uke {weekNumber(weekStart)}</div>
            <div style={{ ...s.muted, fontSize: "12px" }}>
              {dateLabel(days[0])} - {dateLabel(days[6])}
            </div>
          </div>
          <button onClick={() => shiftWeek(1)} aria-label="Neste uke" style={s.iconBtn}>
            <ChevronRight size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {days.map((d) => {
            const iso = toISO(d);
            const entries = byDate[iso] || [];
            const today = isToday(d);
            const picking = pickerDate === iso;

            return (
              <div
                key={iso}
                style={{
                  ...p.dayRow,
                  borderColor: today ? C.orange : C.border,
                  background: today ? C.panelAlt : C.bg,
                }}
              >
                <div style={p.dayHead}>
                  <span style={{ ...p.dayName, color: today ? C.cream : C.muted }}>
                    {dayName(d)}
                    <span style={p.dayDate}>{d.getDate()}.</span>
                  </span>
                  {!picking && (
                    <button
                      onClick={() => setPickerDate(iso)}
                      aria-label={`Legg til middag ${dayName(d)}`}
                      style={{ ...s.iconBtn, color: C.green }}
                    >
                      <Plus size={18} strokeWidth={2.4} />
                    </button>
                  )}
                </div>

                {entries.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {entries.map((entry) => {
                      const r = rettById[entry.rett_id];
                      if (!r) return null;
                      const color = WHEEL_COLORS[r.colorIdx % WHEEL_COLORS.length];
                      return (
                        <div key={entry.id} style={p.mealChip}>
                          {r.bilde_url ? (
                            <img
                              src={r.bilde_url}
                              alt=""
                              style={p.mealThumb}
                              loading="lazy"
                              onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <span style={{ ...p.dot, background: color }} />
                          )}
                          <span style={p.mealName}>{r.name}</span>
                          <button
                            onClick={() => onOpenRecipe(r.id)}
                            aria-label={`Oppskrift for ${r.name}`}
                            style={s.iconBtn}
                          >
                            <BookOpen size={14} strokeWidth={2.2} />
                          </button>
                          <button
                            onClick={() => onUnplan(entry.id)}
                            aria-label={`Fjern ${r.name}`}
                            style={s.iconBtn}
                          >
                            <X size={14} strokeWidth={2.4} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {picking && (
                  <div style={p.pickerBox}>
                    <div style={{ ...s.muted, fontSize: "12px", marginBottom: "6px" }}>
                      Velg rett for {dayName(d)}:
                    </div>
                    <div style={p.pickerGrid}>
                      {retter.length === 0 ? (
                        <span style={{ ...s.muted, fontSize: "12.5px" }}>
                          Legg inn retter under Retter-fanen først.
                        </span>
                      ) : (
                        retter.map((r, i) => (
                          <button
                            key={r.id}
                            onClick={() => choose(r.id)}
                            style={{ ...p.pickerChip, borderColor: WHEEL_COLORS[i % WHEEL_COLORS.length] }}
                          >
                            {r.name}
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => setPickerDate(null)}
                      style={{ ...s.btnGhost, marginTop: "8px", alignSelf: "flex-start" }}
                    >
                      Avbryt
                    </button>
                  </div>
                )}

                {entries.length === 0 && !picking && (
                  <span style={{ ...s.muted, fontSize: "12.5px", color: C.dim }}>
                    Ingen middag planlagt
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CalendarSync token={husholdning?.kalender_token} />
    </div>
  );
}

const p = {
  weekNav: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  weekLabel: { fontFamily: SERIF, fontWeight: 700, fontSize: "18px", color: C.cream },
  dayRow: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  dayHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  dayName: {
    fontSize: "13px",
    fontWeight: 600,
    textTransform: "capitalize",
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
  },
  dayDate: { fontSize: "11.5px", fontWeight: 500, color: C.dim },
  mealChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: "999px",
    padding: "5px 8px 5px 6px",
  },
  mealThumb: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  dot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, marginLeft: "6px" },
  mealName: { color: C.cream, fontSize: "13.5px", flex: 1, minWidth: 0 },
  pickerBox: {
    display: "flex",
    flexDirection: "column",
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "10px",
  },
  pickerGrid: { display: "flex", flexWrap: "wrap", gap: "6px" },
  pickerChip: {
    background: C.bg,
    border: "1px solid",
    borderRadius: "999px",
    padding: "6px 12px",
    color: C.cream,
    fontFamily: SANS,
    fontSize: "12.5px",
    fontWeight: 500,
    cursor: "pointer",
  },
};
