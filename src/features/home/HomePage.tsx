// src/features/home/HomePage.tsx
import { Link } from "react-router-dom";

type CardProps = {
  title: string;
  percent: number;   // progresso 0–1
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
      <div className="w-full bg-gray-200 rounded-full h-4">
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
  // por enquanto valores fixos (mock),
  // depois você puxa dos stores (useDiet, useWater, useTraining, useWeight)
  const dietProgress = 0.6;    // 60%
  const waterProgress = 0.3;   // 30%
  const trainingProgress = 0.8;// 80%
  const weightProgress = 0.4;  // 40%

  return (
    <div className="p-6 grid gap-6">
      <h1 className="text-2xl font-bold mb-4">Meu Progresso</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ProgressCard title="Alimentação diária" percent={dietProgress} link="/diet" />
        <ProgressCard title="Água diária" percent={waterProgress} link="/water" />
        <ProgressCard title="Treino semanal" percent={trainingProgress} link="/training" />
        <ProgressCard title="Meta de peso" percent={weightProgress} link="/weight" />
      </div>
    </div>
  );
}
