import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.empty-state {
  border: 1px dashed rgba(148, 163, 184, 0.9);
  background: rgba(248, 250, 252, 0.7);
  border-radius: 18px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}
.empty-state h3 {
  margin: 0 0 6px;
  font-size: 1.05rem;
}
.empty-state p {
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
}
.empty-state__action {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}