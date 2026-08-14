import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dices, CalendarPlus, Volume2, VolumeX, Check } from "lucide-react";
import { C, WHEEL_COLORS, SANS, SERIF, s } from "./styles.js";
import { playToggle, playSpin, playConfirm, SPIN_MS } from "./lib/sound.js";
import { addDays, toISO, relativeLabel, isWeekendDate } from "./lib/dates.js";

const WHEEL_SIZE = 300;

function wheelColorsFor(n) {
  if (n <= 0) return [];
  const colors = [];
  for (let i = 0; i < n; i++) {
    let idx = i % WHEEL_COLORS.length;
    if (WHEEL_COLORS[idx] === colors[i - 1]) idx = (idx + 1) % WHEEL_COLORS.length;
    colors.push(WHEEL_COLORS[idx]);
  }
  if (n > 1 && colors[n - 1] === colors[0]) {
    const clash = colors[n - 1];
    const replacement = WHEEL_COLORS.find((c) => c !== clash && c !== colors[n - 2]);
    if (replacement) colors[n - 1] = replacement;
  }
  return colors;
}

export default function RouletteView({ retter, onPlan }) {
  const [mode, setMode] = useState(isWeekendDate(new Date()) ? "helg" : "hverdag");
  const [soundOn, setSoundOn] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showDates, setShowDates] = useState(false);
  const [planned, setPlanned] = useState(null);
  const [outgoing, setOutgoing] = useState(null);
  const [rollDir, setRollDir] = useState(null);
  const spinTimeout = useRef(null);
  const rollTimeout = useRef(null);
  const plannedTimeout = useRef(null);

  useEffect(() => () => {
    clearTimeout(spinTimeout.current);
    clearTimeout(rollTimeout.current);
    clearTimeout(plannedTimeout.current);
  }, []);

  const wheelItems = retter.filter((r) => r.kategori === "begge" || r.kategori === mode);
  const n = wheelItems.length;

  const spin = useCallback(() => {
    if (n < 2 || spinning) return;
    setWinner(null);
    setShowDates(false);
    setPlanned(null);
    const slice = 360 / n;
    const idx = Math.floor(Math.random() * n);
    const target = (360 - (idx * slice + slice / 2) + 360) % 360;
    const turns = 5 + Math.floor(Math.random() * 3);
    const current = ((rotation % 360) + 360) % 360;
    const delta = ((target - current) + 360) % 360;

    setSpinning(true);
    setRotation(rotation + delta + turns * 360);
    if (soundOn) playSpin(Math.round((delta + turns * 360) / slice));
    clearTimeout(spinTimeout.current);
    spinTimeout.current = setTimeout(() => {
      setSpinning(false);
      setWinner(wheelItems[idx]);
    }, SPIN_MS);
  }, [n, spinning, rotation, soundOn, wheelItems]);

  const switchMode = useCallback((m) => {
    if (m === mode || spinning) return;
    if (soundOn) playToggle(m === "helg");
    setOutgoing({ items: wheelItems, key: mode });
    setRollDir(m === "helg" ? "left" : "right");
    setMode(m);
    setWinner(null);
    setShowDates(false);
    setPlanned(null);
    clearTimeout(rollTimeout.current);
    rollTimeout.current = setTimeout(() => {
      setOutgoing(null);
      setRollDir(null);
    }, 900);
  }, [mode, spinning, soundOn, wheelItems]);

  const pickDate = async (d) => {
    if (!winner) return;
    const ok = await onPlan(toISO(d), winner.id);
    if (ok) {
      if (soundOn) playConfirm();
      setShowDates(false);
      setPlanned(`${winner.name} - ${relativeLabel(d).toLowerCase()}`);
      clearTimeout(plannedTimeout.current);
      plannedTimeout.current = setTimeout(() => setPlanned(null), 3500);
    }
  };

  const labelMaxWidth = WHEEL_SIZE / 2 - 50;

  const renderWheel = (list, spinRotation, emptyLabel) => {
    const count = list.length;
    const slice = count > 0 ? 360 / count : 360;
    const fontSize = count <= 6 ? 14 : count <= 9 ? 12.5 : count <= 12 ? 11 : 9.5;
    const segmentColors = wheelColorsFor(count);
    const bg =
      count === 0
        ? C.panelAlt
        : count === 1
        ? segmentColors[0]
        : `conic-gradient(${segmentColors
            .map((color, i) => `${color} ${i * slice}deg ${(i + 1) * slice}deg`)
            .join(", ")})`;

    return (
      <>
        <div
          className="drr-wheel"
          style={{ ...w.wheel, background: bg, transform: `rotate(${spinRotation}deg)` }}
        >
          {list.map((it, i) => (
            <div
              key={it.id}
              style={{ position: "absolute", inset: 0, transform: `rotate(${i * slice + slice / 2}deg)` }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "16px",
                  transformOrigin: "left center",
                  transform: "rotate(90deg)",
                  display: "block",
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.1,
                  color: C.bg,
                  whiteSpace: "nowrap",
                  width: `${labelMaxWidth}px`,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={it.name}
              >
                {it.name}
              </span>
            </div>
          ))}
          {count === 0 && emptyLabel && <div style={w.emptyLabel}>{emptyLabel}</div>}
        </div>
        <div style={w.hub} />
      </>
    );
  };

  const dateOptions = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={w.modeToggle} role="tablist" aria-label="Velg hjul">
        {["hverdag", "helg"].map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            style={{ ...w.modeButton, ...(mode === m ? w.modeButtonActive : {}) }}
          >
            {m === "hverdag" ? "Hverdag" : "Helg"}
          </button>
        ))}
        <button
          onClick={() => setSoundOn((v) => !v)}
          aria-label={soundOn ? "Skru av lyd" : "Skru på lyd"}
          style={{ ...s.iconBtn, padding: "8px 12px" }}
        >
          {soundOn ? <Volume2 size={16} strokeWidth={2.2} /> : <VolumeX size={16} strokeWidth={2.2} />}
        </button>
      </div>

      <div style={w.viewport}>
        <div style={w.pointer} />
        {outgoing && (
          <div
            key={`out-${outgoing.key}`}
            className={rollDir === "left" ? "drr-roll-out-left" : "drr-roll-out-right"}
            style={w.slot}
          >
            {renderWheel(outgoing.items, rotation, null)}
          </div>
        )}
        <div
          key={`in-${mode}`}
          className={rollDir === "left" ? "drr-roll-in-right" : rollDir === "right" ? "drr-roll-in-left" : ""}
          style={w.slot}
        >
          {renderWheel(wheelItems, rotation, `Ingen retter for ${mode} enda`)}
        </div>
      </div>

      <button
        className="drr-spin"
        onClick={spin}
        disabled={n < 2 || spinning}
        style={{
          ...s.btnPrimary,
          boxShadow: "0 6px 18px rgba(226,121,58,0.35)",
          opacity: n < 2 || spinning ? 0.45 : 1,
          cursor: n < 2 || spinning ? "not-allowed" : "pointer",
        }}
      >
        <Dices size={18} strokeWidth={2.2} />
        {spinning ? "Spinner…" : "Spinn hjulet"}
      </button>

      {n < 2 && !spinning && retter.length > 0 && (
        <p style={{ ...s.muted, color: C.dim }}>
          Trenger minst to retter i {mode === "hverdag" ? "hverdags" : "helge"}-hjulet.
        </p>
      )}

      <div style={w.winnerArea} aria-live="polite">
        {winner && !planned && (
          <div key={winner.id} className="drr-winner" style={w.winnerCard}>
            <span style={w.winnerEyebrow}>I kveld blir det</span>
            <span style={w.winnerName}>{winner.name}</span>
            {winner.bilde_url && (
              <img
                src={winner.bilde_url}
                alt={winner.name}
                style={w.winnerImg}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            {!showDates ? (
              <button onClick={() => setShowDates(true)} style={{ ...s.btnGhost, marginTop: "8px" }}>
                <CalendarPlus size={15} strokeWidth={2.2} />
                Legg til i kalender
              </button>
            ) : (
              <div style={w.dateRow}>
                {dateOptions.map((d) => (
                  <button key={toISO(d)} onClick={() => pickDate(d)} style={w.dateChip}>
                    {relativeLabel(d)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {planned && (
          <div style={w.plannedBadge}>
            <Check size={15} strokeWidth={2.6} />
            Lagt i planen: {planned}
          </div>
        )}
      </div>
    </div>
  );
}

const w = {
  modeToggle: {
    display: "flex",
    alignItems: "center",
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: "999px",
    padding: "4px",
    gap: "4px",
  },
  modeButton: {
    background: "transparent",
    border: "none",
    borderRadius: "999px",
    padding: "8px 22px",
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: "13.5px",
    color: C.muted,
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  },
  modeButtonActive: { background: C.orange, color: C.bg },
  viewport: { position: "relative", width: "100%", height: `${WHEEL_SIZE}px`, overflow: "hidden" },
  slot: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: `-${WHEEL_SIZE / 2}px`,
    width: `${WHEEL_SIZE}px`,
    height: `${WHEEL_SIZE}px`,
    willChange: "transform",
  },
  pointer: {
    position: "absolute",
    top: "-6px",
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "12px solid transparent",
    borderRight: "12px solid transparent",
    borderTop: `20px solid ${C.cream}`,
    zIndex: 6,
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
  },
  wheel: {
    width: `${WHEEL_SIZE}px`,
    height: `${WHEEL_SIZE}px`,
    borderRadius: "50%",
    position: "relative",
    overflow: "hidden",
    border: `5px solid ${C.cream}`,
    boxShadow: "0 12px 32px rgba(0,0,0,0.45), inset 0 0 0 2px #1B2420",
    transition: "transform 4.2s cubic-bezier(0.12, 0.72, 0.15, 1)",
  },
  hub: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: C.cream,
    border: `4px solid ${C.bg}`,
    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
    zIndex: 3,
  },
  emptyLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: C.dim,
    fontSize: "13px",
    fontWeight: 500,
    textAlign: "center",
    padding: "0 40px",
  },
  winnerArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "96px",
    width: "100%",
  },
  winnerCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "100%" },
  winnerImg: {
    width: "100%",
    maxWidth: "300px",
    aspectRatio: "3 / 2",
    objectFit: "cover",
    borderRadius: "14px",
    border: `1px solid ${C.border}`,
    marginTop: "12px",
    boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
  },
  winnerEyebrow: {
    fontSize: "12px",
    color: C.dim,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 600,
  },
  winnerName: {
    fontFamily: SERIF,
    fontWeight: 700,
    fontSize: "24px",
    color: C.cream,
    textAlign: "center",
  },
  dateRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", marginTop: "10px" },
  dateChip: {
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: "999px",
    padding: "7px 13px",
    color: C.cream,
    fontFamily: SANS,
    fontWeight: 500,
    fontSize: "12.5px",
    cursor: "pointer",
  },
  plannedBadge: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: C.panelAlt,
    border: `1px solid ${C.green}`,
    borderRadius: "999px",
    padding: "9px 16px",
    color: C.cream,
    fontSize: "13.5px",
    fontWeight: 500,
  },
};
