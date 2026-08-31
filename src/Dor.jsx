import React, { useState, useEffect } from "react";
import { ChefHat } from "lucide-react";
import { C, SANS, s } from "./styles.js";
import { playConfirm } from "./lib/sound.js";
import { reduserBevegelse } from "./Oppstart.jsx";

const APNE_MS = 620;

// Vises rett etter en ekte innlogging (ikke ved stille gjenoppretting av økt).
// Døren står lukket mens profil/husholdning hentes, og svinger opp idet klar
// blir sann - onApnet kalles når svingen er ferdig, så den som eier komponenten
// kan bytte til hovedappen uten et hakk i overgangen.
export default function Dor({ klar, onApnet }) {
  const [apner, setApner] = useState(false);
  const redusert = reduserBevegelse();

  useEffect(() => {
    if (!klar) return;
    setApner(true);
    if (!redusert) playConfirm();
    const t = setTimeout(onApnet, redusert ? 120 : APNE_MS);
    return () => clearTimeout(t);
    // Kjør kun når klar går fra usann til sann - apner/onApnet skal ikke trigge effekten på nytt,
    // ellers kansellerer opprydningen den nettopp planlagte timeouten (setApner endrer apner,
    // som lå i dependency-listen, og re-kjøringen sitt cleanup rakk å nulle den ut).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klar]);

  return (
    <div style={{ ...s.page, alignItems: "center", justifyContent: "center", gap: "22px" }}>
      <style>{DOR_CSS}</style>
      <div className={`drr-dor-scene drr-winner${apner ? " drr-dor-apner" : ""}`}>
        <div className="drr-dor-ramme">
          <span className="drr-dor-lys" />
          <span className="drr-dor-floy drr-dor-venstre" />
          <span className="drr-dor-floy drr-dor-hoyre" />
        </div>
        <span className="drr-dor-hatt">
          <ChefHat size={26} strokeWidth={1.8} />
        </span>
      </div>
      <p style={{ ...s.muted, color: C.dim, fontFamily: SANS }}>
        {apner ? "Bare et øyeblikk…" : "Logger inn…"}
      </p>
    </div>
  );
}

const DOR_CSS = `
.drr-dor-scene {
  position: relative;
  width: 200px;
  height: 240px;
  perspective: 900px;
}
.drr-dor-ramme {
  position: absolute;
  inset: 0;
  border-radius: 100px 100px 12px 12px;
  border: 3px solid ${C.border};
  background: ${C.bg};
  overflow: hidden;
}
.drr-dor-lys {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 42%, ${C.gold} 0%, transparent 68%);
  opacity: 0.07;
  animation: drrDorPuls 2600ms ease-in-out infinite;
}
.drr-dor-floy {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: ${C.panelAlt};
}
.drr-dor-venstre { left: 0; border-right: 1px solid ${C.border}; transform-origin: left center; }
.drr-dor-hoyre { right: 0; border-left: 1px solid ${C.border}; transform-origin: right center; }
.drr-dor-hatt {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: ${C.gold};
  animation: drrDorHattPuls 2600ms ease-in-out infinite;
}
@keyframes drrDorPuls {
  0%, 100% { opacity: 0.05; }
  50% { opacity: 0.16; }
}
@keyframes drrDorHattPuls {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.08); }
}
.drr-dor-apner .drr-dor-venstre { animation: drrDorVenstre ${APNE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both; }
.drr-dor-apner .drr-dor-hoyre { animation: drrDorHoyre ${APNE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both; }
.drr-dor-apner .drr-dor-lys { animation: drrDorLysApner ${APNE_MS}ms ease both; }
.drr-dor-apner .drr-dor-hatt { animation: drrDorHattApner ${APNE_MS}ms ease both; }
@keyframes drrDorVenstre { to { transform: rotateY(-108deg); opacity: 0.2; } }
@keyframes drrDorHoyre { to { transform: rotateY(108deg); opacity: 0.2; } }
@keyframes drrDorLysApner {
  0% { opacity: 0.1; }
  45% { opacity: 0.9; }
  100% { opacity: 0; }
}
@keyframes drrDorHattApner {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  40% { opacity: 1; transform: translate(-50%, -50%) scale(1.18); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
}
@media (prefers-reduced-motion: reduce) {
  .drr-dor-scene * { animation-duration: 1ms !important; animation-delay: 0ms !important; animation-iteration-count: 1 !important; }
}
`;
