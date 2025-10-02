import { memo } from "react";

type ProgressBarProps = {
  value: number; // 0 - 1
  label?: string;
  color?: string;
  showLabel?: boolean;
};

function clamp(v: number) {
  return Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
}

export const ProgressBar = memo(function ProgressBar({ value, label, color, showLabel = true }: ProgressBarProps) {
  const pct = Math.round(clamp(value) * 100);
  return (
    <div className="progress">
      {showLabel && (
        <div className="progress__label">
          <span>{label ?? "Progresso"}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%`, backgroundColor: color ?? "#2563eb" }} />
      </div>
    </div>
  );
});

type InlineStyles = {
  [selector: string]: React.CSSProperties;
};

const styles: InlineStyles = {
  ".progress": { display: "flex", flexDirection: "column", gap: "8px" },
  ".progress__label": {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#334155",
  },
  ".progress__track": {
    width: "100%",
    height: "16px",
    background: "rgba(148, 163, 184, 0.3)",
    borderRadius: "999px",
    overflow: "hidden",
  },
  ".progress__fill": {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },
};

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  Object.entries(styles)
    .map(([selector, rules]) => {
      const body = Object.entries(rules)
        .map(([k, v]) => `${k}: ${typeof v === "number" ? `${v}px` : v};`)
        .join(" ");
      return `${selector}{${body}}`;
    })
    .join("\n"),
);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(styleSheet)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
}