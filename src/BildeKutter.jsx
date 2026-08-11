import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, Check, RotateCcw } from "lucide-react";
import { C, SANS, s } from "./styles.js";

const OUT_W = 1200;
const OUT_H = 800;
const RATIO = OUT_H / OUT_W;
const MAX_ZOOM = 4;

export default function BildeKutter({ file, onCancel, onConfirm }) {
  const [src, setSrc] = useState(null);
  const [img, setImg] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [jobber, setJobber] = useState(false);
  const frameRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const mal = () => {
      const el = frameRef.current;
      if (!el) return;
      const wid = el.clientWidth;
      setFrame({ w: wid, h: Math.round(wid * RATIO) });
    };
    mal();
    window.addEventListener("resize", mal);
    return () => window.removeEventListener("resize", mal);
  }, [src]);

  const baseScale =
    img && frame.w ? Math.max(frame.w / img.width, frame.h / img.height) : 1;
  const dispW = img ? img.width * baseScale * scale : 0;
  const dispH = img ? img.height * baseScale * scale : 0;

  const klem = useCallback(
    (o, sc = scale) => {
      if (!img || !frame.w) return o;
      const dW = img.width * baseScale * sc;
      const dH = img.height * baseScale * sc;
      const maxX = Math.max(0, (dW - frame.w) / 2);
      const maxY = Math.max(0, (dH - frame.h) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [img, frame.w, frame.h, baseScale, scale]
  );

  useEffect(() => {
    setOffset((o) => klem(o));
  }, [scale, frame.w, klem]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    setOffset(klem({ x: drag.current.ox + dx, y: drag.current.oy + dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  const nullstill = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const bruk = async () => {
    if (!img || !frame.w) return;
    setJobber(true);
    try {
      const s0 = baseScale * scale;
      const sx = (dispW / 2 - frame.w / 2 - offset.x) / s0;
      const sy = (dispH / 2 - frame.h / 2 - offset.y) / s0;
      const sw = frame.w / s0;
      const sh = frame.h / s0;

      const canvas = document.createElement("canvas");
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);

      canvas.toBlob(
        (blob) => {
          setJobber(false);
          if (blob) onConfirm(blob);
        },
        "image/jpeg",
        0.85
      );
    } catch {
      setJobber(false);
    }
  };

  return (
    <div style={k.overlay}>
      <div style={k.sheet}>
        <div style={k.head}>
          <h3 style={{ ...s.sectionTitle, fontSize: "17px" }}>Tilpass utsnitt</h3>
          <button onClick={onCancel} aria-label="Avbryt" style={s.iconBtn}>
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div style={k.body}>
          <div
            ref={frameRef}
            style={{ ...k.frame, height: frame.h ? `${frame.h}px` : "180px" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src && img && (
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${dispW}px`,
                  height: `${dispH}px`,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
            <div style={k.grid} />
          </div>

          <p style={k.hint}>Dra bildet for å flytte det, og bruk glidebryteren for å zoome.</p>

          <div style={k.zoomRow}>
            <ZoomIn size={16} strokeWidth={2.2} color={C.muted} />
            <input
              type="range"
              min="1"
              max={MAX_ZOOM}
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={k.slider}
              aria-label="Zoom"
            />
            <span style={k.zoomVal}>{scale.toFixed(1)}x</span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={nullstill} style={{ ...s.btnGhost, flex: "0 0 auto" }}>
              <RotateCcw size={14} strokeWidth={2.2} />
              Nullstill
            </button>
            <button onClick={bruk} disabled={jobber || !img} style={{ ...s.btnGreen, flex: 1 }}>
              <Check size={15} strokeWidth={2.4} />
              {jobber ? "Behandler…" : "Bruk bildet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const k = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8,11,10,0.86)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 70,
    padding: "16px",
  },
  sheet: {
    width: "100%",
    maxWidth: "440px",
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: "18px",
    overflow: "hidden",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 14px 10px",
    borderBottom: `1px solid ${C.border}`,
  },
  body: { padding: "14px", display: "flex", flexDirection: "column", gap: "12px" },
  frame: {
    position: "relative",
    width: "100%",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "grab",
    touchAction: "none",
  },
  grid: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(to right, rgba(242,232,213,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(242,232,213,0.16) 1px, transparent 1px)",
    backgroundSize: "33.333% 33.333%",
  },
  hint: { ...s.muted, fontSize: "12px", color: C.dim, margin: 0, textAlign: "center" },
  zoomRow: { display: "flex", alignItems: "center", gap: "10px" },
  slider: { flex: 1, accentColor: C.orange, height: "22px" },
  zoomVal: {
    color: C.muted,
    fontSize: "12px",
    fontWeight: 600,
    minWidth: "34px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
};
