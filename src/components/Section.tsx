import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Section({ title, description, action, children }: SectionProps) {
  return (
    <section className="section">
      <header className="section__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action && <div className="section__action">{action}</div>}
      </header>
      <div>{children}</div>
    </section>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section__header h2 {
  margin: 0;
  font-size: 1.3rem;
}
.section__header p {
  margin: 6px 0 0;
  color: #475569;
  font-size: 0.95rem;
}
.section__action {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
@media (min-width: 640px) {
  .section__header {
    flex-direction: row;
    align-items: center;
  }
  .section__header > div {
    flex: 1;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}