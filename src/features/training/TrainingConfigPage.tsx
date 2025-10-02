// features/training/TrainingConfigPage.tsx
import { useTraining } from "./training.store";

export default function TrainingConfigPage() {
  const {
    catalog, cardioCatalog, template,
    addCatalogExercise, addCardioKind,
    addAmBlock, addPmExercise, updatePmExercise, removePmExercise, saveTemplate
  } = useTraining();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Configurar Treino ABCDE</h1>

      {/* 1) Catálogo */}
      <section className="space-y-3">
        <h2 className="font-semibold">Catálogo de exercícios</h2>
        {/* lista + form “Adicionar” */}
      </section>

      {/* 2) Montar dias (tabs A-E) */}
      <section className="space-y-3">
        <h2 className="font-semibold">Montar ABCDE</h2>
        {/* Tabs A..E => coluna AM (cardio) / coluna PM (exercícios) */}
      </section>

      <div className="flex gap-2">
        <button onClick={saveTemplate} className="px-4 py-2 rounded bg-blue-600 text-white">Salvar</button>
      </div>
    </div>
  );
}
