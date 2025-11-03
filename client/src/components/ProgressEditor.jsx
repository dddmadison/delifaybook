// ProgressEditor.jsx
import React, { useMemo } from "react";

export function ProgressEditor({ current, total, onChangeCurrent }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
  const pct = total ? Math.round((current / total) * 100) : 0;

  const S = useMemo(() => ({
    row: { display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" },
    bar: { width:"100%" },
    chip: { border:"1px solid #e5e7eb", background:"#fff", borderRadius:8, padding:"6px 10px", cursor:"pointer" }
  }), []);

  const bump = (delta) => onChangeCurrent((prev) => clamp(prev + delta, 0, total));
  const setBySlider = (val) => onChangeCurrent(() => clamp(Number(val) || 0, 0, total));

  return (
    <div>
      {/* 1) 슬라이더: 엄지로 쓱 → 페이지/퍼센트 동시 반영 */}
      <div style={S.row}>
        <input
          type="range"
          min={0}
          max={Math.max(1, total)}
          value={current}
          onChange={(e) => setBySlider(e.target.value)}
          style={S.bar}
          aria-label="진행 슬라이더"
        />
        <strong>{pct}%</strong>
        <span style={{ color:"#64748b" }}>
          ({current} / {total}쪽)
        </span>
      </div>

      {/* 2) 퀵칩: ±1 / ±5 / ±10 */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
        {[-10,-5,-1, +1,+5,+10].map((d) => (
          <button key={d} onClick={() => bump(d)} style={S.chip}>
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}
