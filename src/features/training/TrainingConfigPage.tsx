import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { useTraining } from "./training.store";
import { splitOrder } from "./training.service";
import type { Split } from "./training.schema";
import { TrainingDay } from "./TrainingDay";

export default function TrainingConfigPage() {
  const {
    catalog,
    cardioCatalog,
    template,
    addCatalogExercise,
    addCardioKind,
    addAmBlock,
    addPmExercise,
    removeAmBlock,
    removePmExercise,
  } = useTraining();

  const [newExercise, setNewExercise] = useState({ name: "", muscle: "" });
  const [newCardio, setNewCardio] = useState("");
  const [selectedSplit, setSelectedSplit] = useState<Split>("A");
  const [cardioKind, setCardioKind] = useState(cardioCatalog[0]?.kind ?? "Zumba");
  const [cardioMinutes, setCardioMinutes] = useState("30");
  const [exerciseId, setExerciseId] = useState(catalog[0]?.id ?? "");
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("12");
  const [rest, setRest] = useState("60");

  const handleAddExercise = (evt: FormEvent) => {
    evt.preventDefault();
    if (!newExercise.name.trim() || !newExercise.muscle.trim()) return;
    addCatalogExercise(newExercise.name.trim(), newExercise.muscle.trim());
    setNewExercise({ name: "", muscle: "" });
  };

  const handleAddCardio = (evt: FormEvent) => {
    evt.preventDefault();
    if (!newCardio.trim()) return;
    addCardioKind(newCardio.trim());
    setNewCardio("");
  };

  const handleAddCardioBlock = (evt: FormEvent) => {
    evt.preventDefault();
    if (!cardioKind) return;
    addAmBlock(selectedSplit, cardioKind, Number(cardioMinutes) || 20);
    setCardioMinutes("30");
  };

  const handleAddPmExercise = (evt: FormEvent) => {
    evt.preventDefault();
    if (!exerciseId) return;
    addPmExercise(selectedSplit, exerciseId, Number(sets) || 3, reps || "12", Number(rest) || 60);
    setSets("4");
    setReps("12");
    setRest("60");
  };

  return (
    <div className="app-card">
      <Section
        title="Biblioteca de exercícios"
        description="Cadastre variações para montar a divisão do jeito que preferir."
        action={<Link to="/training">Voltar para os treinos</Link>}
      >
        <form className="training-config__form" onSubmit={handleAddExercise}>
          <div className="training-config__grid">
            <label>
              Nome do exercício
              <input
                value={newExercise.name}
                onChange={(e) => setNewExercise((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Grupo muscular
              <input
                value={newExercise.muscle}
                onChange={(e) => setNewExercise((prev) => ({ ...prev, muscle: e.target.value }))}
                required
              />
            </label>
          </div>
          <button type="submit">Adicionar exercício</button>
        </form>

        <div className="training-config__catalog">
          {catalog.map((item) => (
            <span key={item.id}>
              {item.name} · {item.muscle}
            </span>
          ))}
        </div>

        <form className="training-config__form" onSubmit={handleAddCardio}>
          <label>
            Novo cardio
            <input value={newCardio} onChange={(e) => setNewCardio(e.target.value)} placeholder="Ex: Transport" />
          </label>
          <button type="submit">Adicionar cardio</button>
        </form>
      </Section>

      <Section title="Montar divisão" description="Selecione o treino e inclua blocos para as duas partes do dia.">
        <div className="training-config__grid training-config__grid--assign">
          <label>
            Divisão
            <select value={selectedSplit} onChange={(e) => setSelectedSplit(e.target.value as Split)}>
              {splitOrder.map((split) => (
                <option key={split} value={split}>
                  Treino {split}
                </option>
              ))}
            </select>
          </label>
          <form className="training-config__subform" onSubmit={handleAddCardioBlock}>
            <h4>Parte 1 · Cardio</h4>
            <label>
              Modalidade
              <select value={cardioKind} onChange={(e) => setCardioKind(e.target.value)}>
                {cardioCatalog.map((item) => (
                  <option key={item.id} value={item.kind}>
                    {item.kind}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Minutos
              <input value={cardioMinutes} onChange={(e) => setCardioMinutes(e.target.value)} type="number" min={5} step={5} />
            </label>
            <button type="submit" disabled={cardioCatalog.length === 0}>
              Adicionar cardio
            </button>
          </form>
          <form className="training-config__subform" onSubmit={handleAddPmExercise}>
            <h4>Parte 2 · Musculação</h4>
            <label>
              Exercício
              <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                <option value="" disabled>
                  Escolha um exercício
                </option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Séries
              <input value={sets} onChange={(e) => setSets(e.target.value)} type="number" min={1} max={10} />
            </label>
            <label>
              Repetições
              <input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="12" />
            </label>
            <label>
              Descanso (segundos)
              <input value={rest} onChange={(e) => setRest(e.target.value)} type="number" min={30} step={15} />
            </label>
            <button type="submit" disabled={!exerciseId}>
              Adicionar exercício
            </button>
          </form>
        </div>

        <div className="training-config__preview">
          {splitOrder.map((split) => (
            <TrainingDay
              key={split}
              split={split}
              plan={template[split]}
              onRemoveCardio={(id) => removeAmBlock(split, id)}
              onRemoveExercise={(id) => removePmExercise(split, id)}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-config__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}
.training-config__grid {
  display: grid;
  gap: 16px;
}
.training-config__grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.training-config__catalog {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.training-config__catalog span {
  background: white;
  border-radius: 12px;
  padding: 6px 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  font-size: 0.85rem;
}
.training-config__grid--assign {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  align-items: start;
}
.training-config__subform {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  padding: 16px;
  background: rgba(248, 250, 252, 0.8);
}
.training-config__subform h4 {
  margin: 0;
}
.training-config__preview {
  margin-top: 24px;
  display: grid;
  gap: 16px;
}
@media (min-width: 1024px) {
  .training-config__preview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}