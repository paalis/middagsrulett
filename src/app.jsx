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
import { hentProfil, hentHusholdning, loggUt } from "./lib/auth.js";

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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s2) => {
      setOkt(s2 ?? null);
      if (!s2) { setProfil(null); setHusholdning(null); }
    });
    return () => sub.subscription.unsubscribe();
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
    const { error } = await supabase.from("planlagt").update({ dato }).eq("id", id);
    if (error) setSyncError(true);
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

  if (okt === undefined) {
    return (
      <div style={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <p style={{ ...s.muted, color: C.dim }}>Laster</p>
      </div>
    );
  }
  if (!okt) {
    return (
      <>
        <style>{CSS}</style>
        <Login />
      </>
    );
  }
  if (profil && !husholdning) {
    return (
      <>
        <style>{CSS}</style>
        <HusholdningOppsett brukernavn={profil.brukernavn} onFerdig={lastProfil} />
      </>
    );
  }
  if (!profil || !husholdning) {
    return (
      <div style={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <p style={{ ...s.muted, color: C.dim }}>Laster</p>
      </div>
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
@keyframes drrRollOutLeft { to { transform: translateX(-135%) rotate(-165deg); opacity: 0.35; } }
@keyframes drrRollOutRight { to { transform: translateX(135%) rotate(165deg); opacity: 0.35; } }
@keyframes drrRollInRight {
  from { transform: translateX(135%) rotate(165deg); opacity: 0.35; }
  to { transform: translateX(0) rotate(0deg); opacity: 1; }
}
@keyframes drrRollInLeft {
  from { transform: translateX(-135%) rotate(-165deg); opacity: 0.35; }
  to { transform: translateX(0) rotate(0deg); opacity: 1; }
}
.drr-roll-out-left { animation: drrRollOutLeft 420ms cubic-bezier(0.5, 0, 0.9, 0.4) forwards; }
.drr-roll-out-right { animation: drrRollOutRight 420ms cubic-bezier(0.5, 0, 0.9, 0.4) forwards; }
.drr-roll-in-right { animation: drrRollInRight 440ms cubic-bezier(0.15, 0.7, 0.4, 1) 430ms both; }
.drr-roll-in-left { animation: drrRollInLeft 440ms cubic-bezier(0.15, 0.7, 0.4, 1) 430ms both; }
@keyframes drrWinnerIn {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
.drr-winner { animation: drrWinnerIn 380ms cubic-bezier(0.2, 0.7, 0.3, 1) both; }
@keyframes drrSpinIcon { to { transform: rotate(360deg); } }
.drr-spin-icon { animation: drrSpinIcon 900ms linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .drr-wheel { transition: none !important; }
  .drr-roll-out-left, .drr-roll-out-right,
  .drr-roll-in-right, .drr-roll-in-left,
  .drr-winner {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
  }
}
`;
