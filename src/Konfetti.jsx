import React, { useMemo } from "react";
import { WHEEL_COLORS } from "./styles.js";

// Full-skjerm konfettiregn - brukt som feiring når noe nytt blir opprettet.
// Rent visuelt, ingen interaksjon, så den legger seg over alt med pointer-events: none.
export default function Konfetti({ antall = 32 }) {
  const biter = useMemo(
    () =>
      Array.from({ length: antall }, (_, i) => ({
        id: i,
        farge: WHEEL_COLORS[i % WHEEL_COLORS.length],
        venstre: Math.random() * 100,
        forsinkelse: Math.random() * 260,
        varighet: 1500 + Math.random() * 700,
        drift: (Math.random() - 0.5) * 140,
        rotasjon: 260 + Math.random() * 420,
        storrelse: 6 + Math.random() * 5,
        rund: Math.random() < 0.35,
      })),
    [antall]
  );

  return (
    <div className="drr-konfetti-wrap" aria-hidden="true">
      <style>{KONFETTI_CSS}</style>
      {biter.map((b) => (
        <span
          key={b.id}
          className="drr-konfetti-bit"
          style={{
            left: `${b.venstre}%`,
            width: `${b.storrelse}px`,
            height: `${b.storrelse * 1.5}px`,
            background: b.farge,
            borderRadius: b.rund ? "50%" : "2px",
            animationDelay: `${b.forsinkelse}ms`,
            animationDuration: `${b.varighet}ms`,
            "--drift": `${b.drift}px`,
            "--rot": `${b.rotasjon}deg`,
          }}
        />
      ))}
    </div>
  );
}

const KONFETTI_CSS = `
.drr-konfetti-wrap {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 60;
}
.drr-konfetti-bit {
  position: absolute;
  top: -5%;
  opacity: 0;
  animation-name: drrKonfettiFall;
  animation-timing-function: cubic-bezier(0.15, 0.4, 0.35, 1);
  animation-fill-mode: forwards;
}
@keyframes drrKonfettiFall {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg); }
  8% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--drift), 108vh) rotate(var(--rot)); }
}
@media (prefers-reduced-motion: reduce) {
  .drr-konfetti-wrap { display: none; }
}
`;
