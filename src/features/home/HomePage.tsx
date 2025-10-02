// src/features/home/HomePage.tsx
import { Link } from "react-router-dom";
import { useHomeProgress } from "./useHomeProgress";

type CardProps = {
  title: string;
  percent: number;   // 0–1
  link: string;
};

function ProgressCard({ title, percent, link }: CardProps) {
  const pct = Math.round(percent * 100);
  return (
    <Link
      to={link}
      className="block p-4 rounded-2xl shadow-md bg-white hover:bg-gray-50 transition"
    >
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm mt-2 text-gray-600">{pct}% concluído</p>
    </Link>
  );
}

export default function HomePage() {
  const { dietProgress, waterProgress, trainingProgress, weightProgress } = useHomeProgress();

  return (
    <div className="p-6 grid gap-6">
      <h1 className="text-2xl font-bold">Meu Progresso</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ProgressCard title="Alimentação diária" percent={dietProgress} link="/diet" />
        <ProgressCard title="Água diária" percent={waterProgress} link="/water" />
        <ProgressCard title="Treino semanal" percent={trainingProgress} link="/training" />
        <ProgressCard title="Meta de peso" percent={weightProgress} link="/weight" />
      </div>
    </div>
  );
}
