// src/features/home/HomePage.tsx
import { ProgressCard } from "@/components/ProgressCard";
import { useHomeProgress } from "./useHomeProgress";

export default function HomePage() {
  const { dietProgress, waterProgress, trainingProgress, weightProgress } = useHomeProgress();

  return (
    <div className="home">
      <h1>Meus progressos</h1>

      <div className="home__grid">
        <ProgressCard title="Alimentação diária" value={dietProgress} to="/diet" />
        <ProgressCard title="Água diária" value={waterProgress} to="/water" />
        <ProgressCard title="Treino semanal" value={trainingProgress} to="/training" />
        <ProgressCard title="Meta de peso" value={weightProgress} to="/weight" />
      </div>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.home h1 {
  margin: 0;
  font-size: 1.6rem;
}
.home__grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}