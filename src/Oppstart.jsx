import React, { useMemo } from "react";
import { Carrot, Egg, Fish, Beef, Croissant, Apple, CookingPot, Utensils, UtensilsCrossed, Wine, Soup } from "lucide-react";
import { C, WHEEL_COLORS, SANS, SERIF } from "./styles.js";

export const VARIANTER = ["kule", "hjul", "ingredienser", "dekketoy", "damp"];

// Kula lander på ~1450ms og tittelen er på plass ~1900ms, så holder vi bildet et lite øyeblikk.
// Splashen vises aldri lenger enn dette.
export const OPPSTART_MS = 2300;

const NOKKEL_VIST = "drr-oppstart-vist";

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

// Kulerulett er introen; de eldre variantene kan fortsatt hentes fram med ?oppstart=
export const velgVariant = () => variantFraUrl() || "kule";

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

/* 0. Kulerulett - hjulet snurrer inn, kula går rundt og lander i en rute */
const KULE_SEG = 360 / WHEEL_COLORS.length;
const KULE_BAKGRUNN = `conic-gradient(${WHEEL_COLORS.map(
  (farge, i) => `${farge} ${i * KULE_SEG}deg ${(i + 1) * KULE_SEG}deg`
).join(", ")})`;

function Kule() {
  return (
    <div className="drr-opp-kule-wrap">
      <div className="drr-opp-kule-hjul" style={{ background: KULE_BAKGRUNN }}>
        <i className="drr-opp-kule-treff" />
        {WHEEL_COLORS.map((_, i) => (
          <span key={i} className="drr-opp-kule-ribbe" style={{ transform: `rotate(${i * KULE_SEG}deg)` }} />
        ))}
      </div>
      <div className="drr-opp-kule-nav">
        <UtensilsCrossed size={26} strokeWidth={2} />
      </div>
      <span className="drr-opp-kule" />
    </div>
  );
}

// Hver bokstav ruller forbi noen tilfeldige før den lander, som hjulene på en spilleautomat
const RULLE_TEGN = "ABDEFGHIKLMNOPRSTUVØÅ";

function TittelRulle({ tekst }) {
  const strimler = useMemo(
    () =>
      [...tekst].map((tegn) => [
        ...Array.from({ length: 4 }, () => RULLE_TEGN[Math.floor(Math.random() * RULLE_TEGN.length)]),
        tegn,
      ]),
    [tekst]
  );
  return (
    <h1 className="drr-opp-tittel drr-opp-rulle" aria-label={tekst}>
      {strimler.map((strimmel, i) => (
        <span key={i} className="drr-opp-rulle-vindu" aria-hidden="true">
          <span className="drr-opp-rulle-mal">{strimmel[strimmel.length - 1]}</span>
          <span className="drr-opp-rulle-strimmel" style={{ animationDelay: `${780 + i * 55}ms` }}>
            {strimmel.map((tegn, j) => (
              <span key={j}>{tegn}</span>
            ))}
          </span>
        </span>
      ))}
    </h1>
  );
}

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
  kule: Kule,
  hjul: Hjul,
  ingredienser: Ingredienser,
  dekketoy: Dekketoy,
  damp: Damp,
};

const TITTEL = "Middagsrulett";

export default function Oppstart({ variant, onFerdig }) {
  const valgt = useMemo(() => (VARIANTER.includes(variant) ? variant : velgVariant()), [variant]);
  const Scene = SCENER[valgt] || Kule;

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
      {valgt === "kule" ? (
        <>
          <TittelRulle tekst={TITTEL} />
          <p className="drr-opp-undertittel">Hva blir det til middag?</p>
        </>
      ) : (
        <h1 className="drr-opp-tittel drr-opp-tittel-inn">{TITTEL}</h1>
      )}
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

/* 0. Kulerulett */
.drr-opp-kule-wrap { position: relative; width: 184px; height: 184px; }
.drr-opp-kule-hjul {
  position: absolute; inset: 0;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid ${C.cream};
  box-shadow: 0 14px 34px rgba(0,0,0,0.45), inset 0 0 0 2px ${C.bg};
  animation: drrOppKuleHjul 1000ms cubic-bezier(0.12, 0.8, 0.25, 1) both;
}
.drr-opp-kule-ribbe {
  position: absolute; left: 50%; top: 0;
  width: 2px; height: 50%; margin-left: -1px;
  background: ${C.bg};
  opacity: 0.55;
  transform-origin: 50% 100%;
}
.drr-opp-kule-treff {
  position: absolute; inset: 0; display: block;
  background: ${C.cream};
  clip-path: polygon(50% 50%, 50% -2%, 102% -2%);
  opacity: 0;
  animation: drrOppKuleTreff 700ms ease-out 1420ms both;
}
.drr-opp-kule-nav {
  position: absolute; left: 50%; top: 50%;
  width: 62px; height: 62px; margin: -31px 0 0 -31px;
  border-radius: 50%;
  background: ${C.bg};
  border: 4px solid ${C.cream};
  color: ${C.cream};
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  animation: drrOppKuleNav 520ms cubic-bezier(0.2, 1.5, 0.4, 1) 1440ms both;
}
.drr-opp-kule-nav svg { animation: drrOppKuleIkon 520ms cubic-bezier(0.2, 1.5, 0.4, 1) 1440ms both; }
.drr-opp-kule {
  position: absolute; left: 50%; top: 50%;
  width: 14px; height: 14px; margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff 0 22%, ${C.cream} 45%, #B9AE98 100%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  animation: drrOppKule 1300ms cubic-bezier(0.25, 0.6, 0.35, 1) 150ms both;
}
@keyframes drrOppKuleHjul { from { opacity: 0; transform: rotate(-720deg) scale(0.3); } to { opacity: 1; transform: none; } }
@keyframes drrOppKule {
  0%   { opacity: 0; transform: rotate(-560deg) translateY(-104px); }
  10%  { opacity: 1; }
  62%  { transform: rotate(-40deg) translateY(-80px); }
  80%  { transform: rotate(25deg) translateY(-58px); }
  88%  { transform: rotate(36deg) translateY(-66px); }
  94%  { transform: rotate(24deg) translateY(-60px); }
  100% { opacity: 1; transform: rotate(22.5deg) translateY(-62px); }
}
@keyframes drrOppKuleTreff { 0% { opacity: 0; } 25% { opacity: 0.7; } 100% { opacity: 0.22; } }
@keyframes drrOppKuleNav { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 100% { transform: scale(1); } }
@keyframes drrOppKuleIkon { from { transform: rotate(-90deg) scale(0.4); opacity: 0; } to { transform: none; opacity: 1; } }

.drr-opp-rulle { display: flex; justify-content: center; line-height: 1.2; }
/* Vinduet får bredden til bokstaven det lander på, så tittelen ikke blir glissen */
.drr-opp-rulle-vindu { position: relative; display: inline-block; height: 1.2em; overflow: hidden; white-space: pre; }
.drr-opp-rulle-mal { visibility: hidden; }
.drr-opp-rulle-strimmel {
  position: absolute; top: 0; left: 50%; width: 2em; margin-left: -1em;
  display: flex; flex-direction: column;
  animation: drrOppRulle 620ms cubic-bezier(0.3, 0.1, 0.25, 1.25) both;
}
.drr-opp-rulle-strimmel > span { display: block; height: 1.2em; text-align: center; }
@keyframes drrOppRulle { from { transform: translateY(0); opacity: 0; } 30% { opacity: 1; } to { transform: translateY(-4.8em); opacity: 1; } }
.drr-opp-undertittel {
  margin: -14px 0 0;
  color: ${C.muted};
  font-size: 14px;
  letter-spacing: 0.02em;
  animation: drrOppTittel 480ms cubic-bezier(0.2, 0.7, 0.3, 1) 1650ms both;
}

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
