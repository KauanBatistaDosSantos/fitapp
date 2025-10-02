import { useEffect } from "react";
import { Link } from "react-router-dom";
import { isoDate } from "@/lib/date";
import { ProgressBar } from "@/components/ProgressBar";
import { Section } from "@/components/Section";
import { useDiet } from "./diet.store";
import { computeDietProgress } from "./diet.service";
import { DietDayView } from "./DietDayView";

export default function DietPage() {
  const { today, catalog, regenerateTodayFromWeekly, toggleTodayItem } = useDiet();

  useEffect(() => {
    if (today.dateISO !== isoDate()) {
      regenerateTodayFromWeekly(new Date());
    }
  }, [today.dateISO, regenerateTodayFromWeekly]);

  const progress = computeDietProgress(today);

  return (
    <div className="app-card">
      <Section
        title="Sua dieta de hoje"
        description="Cada refeição foi carregada do plano semanal. Marque o que já comeu para acompanhar a sua disciplina."
        action={<Link to="/diet/config">Configurar dieta</Link>}
      >
        <ProgressBar value={progress.itemProgress} label="Itens concluídos" />
        <p className="diet-summary">
          {progress.checkedItems} de {progress.totalItems} itens concluídos · {progress.completedMeals} refeições completas
        </p>
        <DietDayView day={today} dishes={catalog} onToggle={toggleTodayItem} />
      </Section>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.diet-summary {
  margin: 6px 0 18px;
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}