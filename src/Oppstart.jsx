import React, { useMemo } from "react";
import { Carrot, Egg, Fish, Beef, Croissant, Apple, CookingPot, Utensils, Wine, Soup } from "lucide-react";
import { C, WHEEL_COLORS, SANS, SERIF } from "./styles.js";

export const VARIANTER = ["hjul", "ingredienser", "dekketoy", "damp"];

// Lengste variant lander på ~1500ms, så holder vi bildet et lite øyeblikk. Splashen vises aldri lenger enn dette.
export const OPPSTART_MS = 1700;

const NOKKEL_VIST = "drr-oppstart-vist";
const NOKKEL_VARIANT = "drr-oppstart-variant";

export const reduserBevegelse = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ?oppstart=hjul tvinger fram en bestemt variant - praktisk under utvikling
const variantFraUrl = () => {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("oppstart");
  return VARIANTER.includes(v) ? v : null;
};

const tilfeldigVariant = () => VARIANTER[Math.floor(Math.random() * VARIANTER.length)];

export const velgVariant = () => {
  const tvunget = variantFraUrl();
  if (tvunget) return tvunget;
  try {
    const lagret = sessionStorage.getItem(NOKKEL_VARIANT);
    if (VARIANTER.includes(lagret)) return lagret;
    const ny = tilfeldigVariant();
    sessionStorage.setItem(NOKKEL_VARIANT, ny);
    return ny;
  } catch {
    return tilfeldigVariant();
  }
};

// Vises én gang per økt, og aldri for de som har bedt om mindre bevegelse
export const skalViseOppstart = () => {
  if (variantFraUrl()) return true;
  if (reduserBevegelse()) return false;
  try {
    return sessionStorage.getItem(NOKKEL_VIST) !== "1";
  } catch {
    return true;
  }
};

export const markerOppstartVist = () => {
  try {
    sessionStorage.setItem(NOKKEL_VIST, "1");
  } catch {
    /* privat modus - da får vi bare vise den igjen */
  }
};

/* 1. Hjulet som tegner seg selv */
function Hjul() {
  return (
    <div className="drr-opp-hjul-wrap">
      <div className="drr-opp-hjul">
        {WHEEL_COLORS.map((farge, i) => (
          <div key={farge + i} className="drr-opp-seg" style={{ transform: `rotate(${i * 45}deg)` }}>
            <i style={{ background: farge, animationDelay: `${140 + i * 70}ms` }} />
          </div>
        ))}
      </div>
      <div className="drr-opp-nav" />
      <div className="drr-opp-peker" />
    </div>
  );
}

/* 2. Ingredienser som faller ned i gryta */
const INGREDIENSER = [
  { Ikon: Carrot, x: -78, rot: -34, farge: C.orange },
  { Ikon: Egg, x: -44, rot: 22, farge: C.cream },
  { Ikon: Fish, x: -6, rot: -18, farge: C.dim },
  { Ikon: Beef, x: 32, rot: 30, farge: C.terra },
  { Ikon: Croissant, x: 66, rot: -26, farge: C.gold },
  { Ikon: Apple, x: 96, rot: 16, farge: C.green },
];

function Ingredienser() {
  return (
    <div className="drr-opp-gryte-wrap">
      {INGREDIENSER.map(({ Ikon, x, rot, farge }, i) => (
        <span
          key={i}
          className="drr-opp-fall"
          style={{ "--x": `${x}px`, "--r": `${rot}deg`, color: farge, animationDelay: `${i * 105}ms` }}
        >
          <Ikon size={28} strokeWidth={2} />
        </span>
      ))}
      <span className="drr-opp-gryte">
        <CookingPot size={62} strokeWidth={1.7} />
      </span>
    </div>
  );
}

/* 3. Dekketøy som dekker bordet */
function Dekketoy() {
  return (
    <div className="drr-opp-bord">
      <span className="drr-opp-bestikk">
        <Utensils size={40} strokeWidth={1.8} />
      </span>
      <span className="drr-opp-tallerken">
        <span className="drr-opp-tallerken-ring" />
      </span>
      <span className="drr-opp-glass">
        <Wine size={36} strokeWidth={1.8} />
      </span>
    </div>
  );
}

/* 4. Damp over gryta - den eneste som går i loop, brukt når vi faktisk venter */
function Damp() {
  return (
    <div className="drr-opp-damp-wrap">
      <svg className="drr-opp-damp" viewBox="0 0 84 64" width="84" height="64" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${18 + i * 24} 62 C ${10 + i * 24} 48, ${26 + i * 24} 42, ${18 + i * 24} 28 C ${
              12 + i * 24
            } 16, ${24 + i * 24} 10, ${18 + i * 24} 2`}
            fill="none"
            stroke={C.cream}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ animationDelay: `${i * 380}ms` }}
          />
        ))}
      </svg>
      <span className="drr-opp-suppe">
        <Soup size={54} strokeWidth={1.7} />
      </span>
    </div>
  );
}

const SCENER = {
  hjul: Hjul,
  ingredienser: Ingredienser,
  dekketoy: Dekketoy,
  damp: Damp,
};

const TITTEL = "Middagsrulett";

export default function Oppstart({ variant, onFerdig }) {
  const valgt = useMemo(() => (VARIANTER.includes(variant) ? variant : velgVariant()), [variant]);
  const Scene = SCENER[valgt] || Hjul;

  return (
    <div
      className="drr-opp"
      onClick={onFerdig}
      role={onFerdig ? "button" : undefined}
      tabIndex={onFerdig ? 0 : undefined}
      onKeyDown={onFerdig ? (e) => (e.key === "Enter" || e.key === " ") && onFerdig() : undefined}
      aria-label={onFerdig ? "Hopp over introen" : undefined}
    >
      <style>{OPPSTART_CSS}</style>
      <div className="drr-opp-scene" aria-hidden="true">
        <Scene />
      </div>
      <h1 className="drr-opp-tittel drr-opp-tittel-inn">{TITTEL}</h1>
    </div>
  );
}

const OPPSTART_CSS = `
.drr-opp {
  min-height: 100vh;
  min-height: 100dvh;
  background: ${C.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 24px;
  font-family: ${SANS};
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border: none;
}
.drr-opp:focus-visible { outline: 3px solid ${C.cream}; outline-offset: -6px; }
.drr-opp-scene {
  position: relative;
  width: 100%;
  max-width: 320px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.drr-opp-tittel {
  font-family: ${SERIF};
  font-weight: 700;
  font-size: 30px;
  letter-spacing: -0.01em;
  color: ${C.cream};
  margin: 0;
  text-align: center;
}
.drr-opp-tittel-inn { animation: drrOppTittel 520ms cubic-bezier(0.2, 0.7, 0.3, 1) 950ms both; }
@keyframes drrOppTittel { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

/* 1. Hjulet */
.drr-opp-hjul-wrap { position: relative; width: 176px; height: 176px; }
.drr-opp-hjul {
  position: absolute; inset: 0;
  border-radius: 50%;
  overflow: hidden;
  background: ${C.panelAlt};
  animation: drrOppHjul 1200ms cubic-bezier(0.16, 0.86, 0.3, 1) both;
}
.drr-opp-seg { position: absolute; inset: 0; }
.drr-opp-seg i {
  position: absolute; inset: 0; display: block;
  clip-path: polygon(50% 50%, 50% -2%, 102% -2%);
  animation: drrOppSeg 360ms cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
.drr-opp-nav {
  position: absolute; left: 50%; top: 50%;
  width: 40px; height: 40px; margin: -20px 0 0 -20px;
  border-radius: 50%;
  background: ${C.bg};
  border: 3px solid ${C.cream};
  animation: drrOppNav 420ms cubic-bezier(0.2, 1.4, 0.4, 1) 700ms both;
}
.drr-opp-peker {
  position: absolute; left: 50%; top: -14px; margin-left: -11px;
  width: 0; height: 0;
  border-left: 11px solid transparent;
  border-right: 11px solid transparent;
  border-top: 20px solid ${C.cream};
  animation: drrOppPeker 420ms cubic-bezier(0.3, 1.5, 0.5, 1) 900ms both;
}
@keyframes drrOppHjul { from { opacity: 0; transform: rotate(-540deg) scale(0.25); } to { opacity: 1; transform: none; } }
@keyframes drrOppSeg { from { opacity: 0; transform: scale(0.55); } to { opacity: 1; transform: none; } }
@keyframes drrOppNav { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: none; } }
@keyframes drrOppPeker { from { opacity: 0; transform: translateY(-26px); } to { opacity: 1; transform: none; } }

/* 2. Ingredienser i gryta */
.drr-opp-gryte-wrap { position: relative; width: 240px; height: 200px; }
.drr-opp-fall {
  position: absolute; left: 50%; top: 50%;
  margin: -14px 0 0 -14px;
  display: block;
  animation: drrOppFall 950ms cubic-bezier(0.45, 0.05, 0.55, 1) both;
}
.drr-opp-gryte {
  position: absolute; left: 50%; bottom: 6px;
  margin-left: -31px;
  color: ${C.cream};
  animation: drrOppGryte 700ms ease-in-out 250ms 2 both;
}
@keyframes drrOppFall {
  0%   { opacity: 0; transform: translate(var(--x), -170px) rotate(calc(var(--r) * -1)) scale(1); }
  14%  { opacity: 1; }
  58%  { opacity: 1; transform: translate(calc(var(--x) * 0.45), 26px) rotate(var(--r)) scale(1); }
  74%  { opacity: 1; transform: translate(calc(var(--x) * 0.2), 2px) rotate(calc(var(--r) * 0.4)) scale(0.94); }
  100% { opacity: 0; transform: translate(0, 52px) rotate(0deg) scale(0.2); }
}
@keyframes drrOppGryte {
  0%, 100% { transform: rotate(0deg); }
  30% { transform: rotate(-4deg); }
  65% { transform: rotate(4deg); }
}

/* 3. Dekketøy */
.drr-opp-bord { position: relative; width: 240px; height: 160px; display: flex; align-items: center; justify-content: center; }
.drr-opp-tallerken {
  width: 108px; height: 108px;
  border-radius: 50%;
  background: ${C.panelAlt};
  border: 3px solid ${C.cream};
  display: flex; align-items: center; justify-content: center;
  animation: drrOppTallerken 620ms cubic-bezier(0.2, 1.2, 0.35, 1) both;
}
.drr-opp-tallerken-ring { width: 72px; height: 72px; border-radius: 50%; border: 2px solid ${C.border}; }
.drr-opp-bestikk {
  position: absolute; left: 12px; top: 50%; margin-top: -20px;
  color: ${C.muted};
  animation: drrOppBestikk 620ms cubic-bezier(0.2, 1.1, 0.35, 1) 300ms both;
}
.drr-opp-glass {
  position: absolute; right: 14px; top: 50%; margin-top: -18px;
  color: ${C.gold};
  animation: drrOppGlass 620ms cubic-bezier(0.2, 1.1, 0.35, 1) 440ms both;
}
@keyframes drrOppTallerken { from { opacity: 0; transform: scale(0.2) rotate(-40deg); } to { opacity: 1; transform: none; } }
@keyframes drrOppBestikk { from { opacity: 0; transform: translateX(-96px) rotate(-95deg); } to { opacity: 1; transform: none; } }
@keyframes drrOppGlass { from { opacity: 0; transform: translateX(96px) rotate(95deg); } to { opacity: 1; transform: none; } }

/* 4. Damp */
.drr-opp-damp-wrap { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.drr-opp-damp path { stroke-dasharray: 26 74; animation: drrOppDamp 2200ms linear infinite; }
.drr-opp-suppe { color: ${C.cream}; animation: drrOppSuppe 2200ms ease-in-out infinite; }
@keyframes drrOppDamp {
  0%   { stroke-dashoffset: 100; opacity: 0; }
  25%  { opacity: 0.85; }
  75%  { opacity: 0.85; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
@keyframes drrOppSuppe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

@media (prefers-reduced-motion: reduce) {
  .drr-opp * { animation-duration: 1ms !important; animation-delay: 0ms !important; animation-iteration-count: 1 !important; }
}
`;
