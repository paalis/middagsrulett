import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dices, CalendarDays, ShoppingCart, UtensilsCrossed, ChefHat, LogOut } from "lucide-react";
import { C, s } from "./styles.js";
import { supabase } from "./lib/supabase.js";
import { mondayOf, addDays, toISO } from "./lib/dates.js";
import RouletteView from "./RouletteView.jsx";
import PlanView from "./PlanView.jsx";
import ShoppingView from "./ShoppingView.jsx";
import RecipeEditor from "./RecipeEditor.jsx";
import RetterView from "./RetterView.jsx";
import Login from "./Login.jsx";
import HusholdningOppsett from "./HusholdningOppsett.jsx";
import Dor from "./Dor.jsx";
import { hentProfil, hentHusholdning, loggUt } from "./lib/auth.js";
import Oppstart, { OPPSTART_MS, skalViseOppstart, markerOppstartVist } from "./Oppstart.jsx";

export default function App() {
  const [tab, setTab] = useState("rulett");
  const [retter, setRetter] = useState([]);
  const [ingredienser, setIngredienser] = useState([]);
  const [planlagt, setPlanlagt] = useState([]);
  const [syncError, setSyncError] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [okt, setOkt] = useState(undefined);
  const [profil, setProfil] = useState(null);
  const [husholdning, setHusholdning] = useState(null);
  const [splashFerdig, setSplashFerdig] = useState(() => !skalViseOppstart());
  const [dorApen, setDorApen] = useState(true);
  const [nyligInnlogget, setNyligInnlogget] = useState(false);

  useEffect(() => {
    if (splashFerdig) return;
    const t = setTimeout(() => {
      markerOppstartVist();
      setSplashFerdig(true);
    }, OPPSTART_MS);
    return () => clearTimeout(t);
  }, [splashFerdig]);

  const hoppOverSplash = useCallback(() => {
    markerOppstartVist();
    setSplashFerdig(true);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!husholdning) return;
    const [r, i, p] = await Promise.all([
      supabase.from("retter").select("id, name, kategori, oppskrift, bilde_url").order("created_at"),
      supabase.from("ingredienser").select("id, rett_id, navn, mengde").order("created_at"),
      supabase.from("planlagt").select("id, dato, rett_id").order("dato"),
    ]);
    if (r.error || i.error || p.error) {
      setSyncError(true);
      return;
    }
    setRetter(r.data);
    setIngredienser(i.data);
    setPlanlagt(p.data);
    setSyncError(false);
  }, [husholdning]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOkt(data.session ?? null));
    // Merk: Supabase sender et SIGNED_IN-event også når en lagret økt gjenopprettes
    // ved sideinnlasting, ikke bare ved en faktisk innlogging - så det skiller ikke
    // de to tilfellene. nyligInnlogget settes derfor direkte fra Login sin send()
    // i stedet, rett etter et vellykket loggInn()-kall.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s2) => {
      setOkt(s2 ?? null);
      if (!s2) {
        setProfil(null);
        setHusholdning(null);
        setDorApen(true);
        setNyligInnlogget(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const varsleInnlogget = useCallback(() => {
    setNyligInnlogget(true);
    setDorApen(false);
  }, []);

  const lastProfil = useCallback(async () => {
    const pr = await hentProfil();
    setProfil(pr);
    setHusholdning(pr?.husholdning_id ? await hentHusholdning() : null);
  }, []);

  useEffect(() => {
    if (okt) lastProfil();
  }, [okt, lastProfil]);

  useEffect(() => {
    if (!husholdning) return;
    fetchAll();
    const channel = supabase
      .channel("middagsrulett-alt")
      .on("postgres_changes", { event: "*", schema: "public", table: "retter" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredienser" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "planlagt" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll, husholdning]);

  const addRett = async (name, kategori) => {
    const { error } = await supabase
      .from("retter")
      .insert({ name, kategori, husholdning_id: husholdning.id });
    if (error) setSyncError(true);
  };

  const cycleCategory = async (rett) => {
    const next =
      rett.kategori === "begge" ? "hverdag" : rett.kategori === "hverdag" ? "helg" : "begge";
    const { error } = await supabase.from("retter").update({ kategori: next }).eq("id", rett.id);
    if (error) setSyncError(true);
  };

  const removeRett = async (id) => {
    const { error } = await supabase.from("retter").delete().eq("id", id);
    if (error) setSyncError(true);
  };

  const plan = async (dato, rettId) => {
    const { error } = await supabase
      .from("planlagt")
      .insert({ dato, rett_id: rettId, husholdning_id: husholdning.id });
    if (error) { setSyncError(true); return false; }
    return true;
  };

  const unplan = async (id) => {
    const { error } = await supabase.from("planlagt").delete().eq("id", id);
    if (error) setSyncError(true);
  };

  const movePlan = async (id, dato) => {
    setPlanlagt((prev) => prev.map((p) => (p.id === id ? { ...p, dato } : p)));
    const { error } = await supabase.from("planlagt").update({ dato }).eq("id", id);
    if (error) { setSyncError(true); fetchAll(); }
  };

  const saveRecipe = async (rettId, oppskrift) => {
    const { error } = await supabase.from("retter").update({ oppskrift }).eq("id", rettId);
    if (error) setSyncError(true);
  };

  const saveBilde = async (rettId, bildeUrl) => {
    const { error } = await supabase.from("retter").update({ bilde_url: bildeUrl }).eq("id", rettId);
    if (error) setSyncError(true);
    else setRetter((prev) => prev.map((r) => (r.id === rettId ? { ...r, bilde_url: bildeUrl } : r)));
  };

  const addIngredient = async (rettId, navn, mengde) => {
    const { error } = await supabase
      .from("ingredienser")
      .insert({ rett_id: rettId, navn, mengde: mengde || null });
    if (error) setSyncError(true);
  };

  const deleteIngredient = async (id) => {
    const { error } = await supabase.from("ingredienser").delete().eq("id", id);
    if (error) setSyncError(true);
  };

  const weekPlannedCount = useMemo(() => {
    const start = mondayOf(new Date());
    const week = Array.from({ length: 7 }, (_, i) => toISO(addDays(start, i)));
    return planlagt.filter((p) => week.includes(p.dato)).length;
  }, [planlagt]);

  const editing = retter.find((r) => r.id === editingId) || null;

  const TABS = [
    { id: "rulett", label: "Rulett", icon: Dices },
    { id: "plan", label: "Plan", icon: CalendarDays, badge: weekPlannedCount },
    { id: "handleliste", label: "Handle", icon: ShoppingCart },
    { id: "retter", label: "Retter", icon: UtensilsCrossed },
  ];

  if (!splashFerdig) {
    return (
      <>
        <style>{CSS}</style>
        <Oppstart onFerdig={hoppOverSplash} />
      </>
    );
  }
  if (okt === undefined) {
    return (
      <>
        <style>{CSS}</style>
        <Oppstart variant="damp" />
      </>
    );
  }
  if (!okt) {
    return (
      <>
        <style>{CSS}</style>
        <Login onLoggetInn={varsleInnlogget} />
      </>
    );
  }
  if (profil && !husholdning) {
    return (
      <>
        <style>{CSS}</style>
        <HusholdningOppsett
          brukernavn={profil.brukernavn}
          onFerdig={async () => {
            await lastProfil();
            setDorApen(true);
          }}
        />
      </>
    );
  }
  const husholdningKlar = !!(profil && husholdning);
  if (!husholdningKlar || !dorApen) {
    return (
      <>
        <style>{CSS}</style>
        {nyligInnlogget ? (
          <Dor klar={husholdningKlar} onApnet={() => setDorApen(true)} />
        ) : (
          <Oppstart variant="damp" />
        )}
      </>
    );
  }

  return (
    <div style={s.page}>
      <style>{CSS}</style>
      <div style={s.container}>
        <header style={s.header}>
          <div style={s.eyebrow}>
            <ChefHat size={14} strokeWidth={2.2} />
            <span>{husholdning.navn}</span>
          </div>
          <h1 style={s.title}>Middagsrulett</h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ ...s.muted, fontSize: "12px", color: C.dim }}>
              Logget inn som {profil.brukernavn}
            </span>
            <button
              onClick={loggUt}
              style={{ ...s.iconBtn, padding: "3px" }}
              aria-label="Logg ut"
              title="Logg ut"
            >
              <LogOut size={14} strokeWidth={2.2} />
            </button>
          </div>
          {syncError && (
            <p style={s.syncWarning}>Fikk ikke kontakt med databasen. Sjekk nettforbindelsen.</p>
          )}
        </header>

        <div style={s.tabBar} role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                style={{ ...s.tab, ...(active ? s.tabActive : {}) }}
              >
                <Icon size={14} strokeWidth={2.2} />
                {t.label}
                {t.badge > 0 && (
                  <span
                    style={{
                      ...s.tabBadge,
                      background: active ? C.bg : C.panelAlt,
                      color: active ? C.cream : C.muted,
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "rulett" && (
          <>
            <RouletteView retter={retter} onPlan={plan} />
            {retter.length === 0 && (
              <p style={{ ...s.empty, ...s.panel, textAlign: "center" }}>
                Ingen retter enda. Legg dem inn under <strong style={{ color: C.cream }}>Retter</strong>.
              </p>
            )}
          </>
        )}

        {tab === "retter" && (
          <RetterView
            retter={retter}
            ingredienser={ingredienser}
            onAdd={addRett}
            onCycleCategory={cycleCategory}
            onRemove={removeRett}
            onOpenRecipe={setEditingId}
          />
        )}

        {tab === "plan" && (
          <PlanView
            retter={retter}
            planlagt={planlagt}
            onPlan={plan}
            onUnplan={unplan}
            onMove={movePlan}
            onOpenRecipe={setEditingId}
            husholdning={husholdning}
          />
        )}

        {tab === "handleliste" && (
          <ShoppingView retter={retter} ingredienser={ingredienser} planlagt={planlagt} />
        )}
      </div>

      {editing && (
        <RecipeEditor
          rett={editing}
          ingredienser={ingredienser}
          onClose={() => setEditingId(null)}
          onSaveRecipe={saveRecipe}
          onSaveBilde={saveBilde}
          onAddIngredient={addIngredient}
          onDeleteIngredient={deleteIngredient}
        />
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Work+Sans:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
body { margin: 0; background: #1B2420; }
.drr-input::placeholder { color: #8A9188; }
.drr-input:focus { outline: 2px solid #E2793A; outline-offset: 1px; }
.drr-chip button:focus-visible { outline: 2px solid #F2E8D5; outline-offset: 1px; }
.drr-spin:focus-visible { outline: 3px solid #F2E8D5; outline-offset: 3px; }
/* Spilleautomat-rulle: begge hjulene glir sammen som én strimmel, med uskarphet i farta og et lite klonk i stopp */
@keyframes drrReelOutOpp {
  0% { transform: translateY(0) scale(1); filter: blur(0); opacity: 1; }
  100% { transform: translateY(-112%) scale(0.86, 0.94); filter: blur(4px); opacity: 0.4; }
}
@keyframes drrReelOutNed {
  0% { transform: translateY(0) scale(1); filter: blur(0); opacity: 1; }
  100% { transform: translateY(112%) scale(0.86, 0.94); filter: blur(4px); opacity: 0.4; }
}
@keyframes drrReelInOpp {
  0% { transform: translateY(112%) scale(0.86, 0.94); filter: blur(4px); opacity: 0.4; }
  55% { transform: translateY(-7%) scale(1.02, 0.98); filter: blur(0); opacity: 1; }
  75% { transform: translateY(2.5%) scale(0.99, 1.01); }
  100% { transform: translateY(0) scale(1); filter: blur(0); opacity: 1; }
}
@keyframes drrReelInNed {
  0% { transform: translateY(-112%) scale(0.86, 0.94); filter: blur(4px); opacity: 0.4; }
  55% { transform: translateY(7%) scale(1.02, 0.98); filter: blur(0); opacity: 1; }
  75% { transform: translateY(-2.5%) scale(0.99, 1.01); }
  100% { transform: translateY(0) scale(1); filter: blur(0); opacity: 1; }
}
.drr-reel-out-opp { animation: drrReelOutOpp 300ms cubic-bezier(0.55, 0, 0.85, 0.35) forwards; }
.drr-reel-out-ned { animation: drrReelOutNed 300ms cubic-bezier(0.55, 0, 0.85, 0.35) forwards; }
.drr-reel-in-opp { animation: drrReelInOpp 560ms cubic-bezier(0.2, 0.7, 0.3, 1) 120ms both; }
.drr-reel-in-ned { animation: drrReelInNed 560ms cubic-bezier(0.2, 0.7, 0.3, 1) 120ms both; }
@keyframes drrWinnerIn {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
.drr-winner { animation: drrWinnerIn 380ms cubic-bezier(0.2, 0.7, 0.3, 1) both; }
@keyframes drrSpinIcon { to { transform: rotate(360deg); } }
.drr-spin-icon { animation: drrSpinIcon 900ms linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .drr-wheel { transition: none !important; }
  .drr-mode-thumb { transition: none !important; }
  .drr-reel-out-opp, .drr-reel-out-ned,
  .drr-reel-in-opp, .drr-reel-in-ned,
  .drr-winner {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
  }
}
`;
