import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { defaultSplitLabels, useTraining } from "./training.store";
import { splitOrder } from "./training.service";
import type { Split } from "./training.schema";
import { TrainingDay } from "./TrainingDay";

export default function TrainingConfigPage() {
  const {
    catalog,
    cardioCatalog,
    template,
    preferences,
    addCatalogExercise,
    updateCatalogExercise,
    removeCatalogExercise,
    addCardioKind,
    addAmBlock,
    updateAmBlock,
    addPmExercise,
    removeAmBlock,
    removePmExercise,
    updatePmExercise,
    movePmExercise,
    setPreferences,
  } = useTraining();

  const [newExercise, setNewExercise] = useState({
    name: "",
    muscle: "",
    gifUrl: "",
    secondary: "",
    substitutions: [] as string[],
  });
  const [newCardio, setNewCardio] = useState("");
  const [selectedSplit, setSelectedSplit] = useState<Split>("A");
  const [cardioKind, setCardioKind] = useState(cardioCatalog[0]?.kind ?? "");
  const [cardioMinutes, setCardioMinutes] = useState("30");
  const [exerciseId, setExerciseId] = useState(catalog[0]?.id ?? "");
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("12");
  const [rest, setRest] = useState("60");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({ name: "", muscle: "", gifUrl: "", secondary: "", substitutions: [] as string[] });

  const handleSplitLabelChange = (split: Split, value: string) => {
    setPreferences({
      splitLabels: {
        ...preferences.splitLabels,
        [split]: value,
      },
    });
  };

  useEffect(() => {
    if (cardioCatalog.length === 0 && cardioKind !== "") {
      setCardioKind("");
    } else if (cardioCatalog.length > 0 && !cardioCatalog.some((item) => item.kind === cardioKind)) {
      setCardioKind(cardioCatalog[0].kind);
    }
  }, [cardioCatalog, cardioKind]);

  useEffect(() => {
    if (catalog.length === 0 && exerciseId !== "") {
      setExerciseId("");
    } else if (catalog.length > 0 && !catalog.some((item) => item.id === exerciseId)) {
      setExerciseId(catalog[0].id);
    }
  }, [catalog, exerciseId]);

  const muscleOptions = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.muscle) set.add(item.muscle);
      item.muscles?.forEach((muscle) => muscle && set.add(muscle));
      item.secondaryMuscles?.forEach((muscle) => muscle && set.add(muscle));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  const handleAddExercise = (evt: FormEvent) => {
    evt.preventDefault();
    if (!newExercise.name.trim() || !newExercise.muscle.trim()) return;
    const secondary = newExercise.secondary
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    addCatalogExercise({
      name: newExercise.name.trim(),
      muscle: newExercise.muscle.trim(),
      gifUrl: newExercise.gifUrl.trim() || undefined,
      secondaryMuscles: secondary,
      substitutions: newExercise.substitutions,
      muscles: [newExercise.muscle.trim(), ...secondary],
    });
    setNewExercise({ name: "", muscle: "", gifUrl: "", secondary: "", substitutions: [] });
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

  const handleStartEdit = (id: string) => {
    const item = catalog.find((entry) => entry.id === id);
    if (!item) return;
    setEditingId(id);
    setEditingForm({
      name: item.name,
      muscle: item.muscle ?? "",
      gifUrl: item.gifUrl ?? "",
      secondary: (item.secondaryMuscles ?? []).join(", "),
      substitutions: item.substitutions ?? [],
    });
  };

  const handleUpdateCatalog = (evt: FormEvent) => {
    evt.preventDefault();
    if (!editingId) return;
    const secondary = editingForm.secondary
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    updateCatalogExercise(editingId, {
      name: editingForm.name.trim() || "Exercício",
      muscle: editingForm.muscle.trim(),
      gifUrl: editingForm.gifUrl.trim() || undefined,
      secondaryMuscles: secondary,
      substitutions: editingForm.substitutions,
      muscles: [editingForm.muscle.trim(), ...secondary],
    });
    setEditingId(null);
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
                list="muscle-options"
                value={newExercise.muscle}
                onChange={(e) => setNewExercise((prev) => ({ ...prev, muscle: e.target.value }))}
                required
              />
            </label>
          </div>
          <label>
            Músculos secundários (separados por vírgula)
            <input
              value={newExercise.secondary}
              onChange={(e) => setNewExercise((prev) => ({ ...prev, secondary: e.target.value }))}
              placeholder="Ombros, tríceps"
            />
          </label>
          <label>
            GIF de referência
            <input
              value={newExercise.gifUrl}
              onChange={(e) => setNewExercise((prev) => ({ ...prev, gifUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label>
            Sugestões de substituição
            <select
              multiple
              value={newExercise.substitutions}
              onChange={(e) =>
                setNewExercise((prev) => ({
                  ...prev,
                  substitutions: Array.from(e.target.selectedOptions).map((option) => option.value),
                }))
              }
            >
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Adicionar exercício</button>
        </form>

        <datalist id="muscle-options">
          {muscleOptions.map((muscle) => (
            <option key={muscle} value={muscle} />
          ))}
        </datalist>

        <div className="training-config__catalog">
          {catalog.map((item) => (
            <div key={item.id} className="training-config__catalogItem">
              <div>
                <strong>{item.name}</strong>
                <span className="training-config__catalogSubtitle">{[item.muscle, ...(item.secondaryMuscles ?? [])].filter(Boolean).join(", ")}</span>
                {item.gifUrl && (
                  <a href={item.gifUrl} target="_blank" rel="noreferrer" className="training-config__catalogLink">
                    Ver demonstração
                  </a>
                )}
              </div>
              <div className="training-config__catalogActions">
                <button type="button" onClick={() => handleStartEdit(item.id)}>
                  Editar
                </button>
                <button type="button" className="training-config__catalogRemove" onClick={() => removeCatalogExercise(item.id)}>
                  Remover
                </button>
              </div>
              {editingId === item.id && (
                <form className="training-config__editForm" onSubmit={handleUpdateCatalog}>
                  <label>
                    Nome
                    <input
                      value={editingForm.name}
                      onChange={(e) => setEditingForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Grupo principal
                    <input
                      list="muscle-options"
                      value={editingForm.muscle}
                      onChange={(e) => setEditingForm((prev) => ({ ...prev, muscle: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Músculos secundários
                    <input
                      value={editingForm.secondary}
                      onChange={(e) => setEditingForm((prev) => ({ ...prev, secondary: e.target.value }))}
                      placeholder="Ombros, tríceps"
                    />
                  </label>
                  <label>
                    GIF de referência
                    <input
                      value={editingForm.gifUrl}
                      onChange={(e) => setEditingForm((prev) => ({ ...prev, gifUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </label>
                  <label>
                    Substituições sugeridas
                    <select
                      multiple
                      value={editingForm.substitutions}
                      onChange={(e) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          substitutions: Array.from(e.target.selectedOptions).map((option) => option.value),
                        }))
                      }
                    >
                      {catalog
                        .filter((option) => option.id !== item.id)
                        .map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="training-config__editActions">
                    <button type="submit">Salvar alterações</button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
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

      <Section
        title="Identificar treinos"
        description="Escolha como cada dia da divisão será apresentado nos treinos e no acompanhamento semanal."
      >
        <div className="training-config__grid training-config__grid--labels">
          {splitOrder.map((split) => (
            <label key={split}>
              Treino {split}
              <input
                value={preferences.splitLabels[split] ?? ""}
                onChange={(event) => handleSplitLabelChange(split, event.target.value)}
                placeholder={defaultSplitLabels[split]}
              />
            </label>
          ))}
        </div>
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
                        <h4>Adicionar cardio</h4>
            <label>
              Tipo de cardio
              <select value={cardioKind} onChange={(e) => setCardioKind(e.target.value)}>
                <option value="" disabled>
                  Selecione uma opção
                </option>
                {cardioCatalog.map((item) => (
                  <option key={item.id} value={item.kind}>
                    {item.kind}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Duração (minutos)
              <input value={cardioMinutes} onChange={(e) => setCardioMinutes(e.target.value)} type="number" min={5} step={5} />
            </label>
            <button type="submit" disabled={!cardioKind}>
              Adicionar bloco AM
            </button>
          </form>
          <form className="training-config__subform" onSubmit={handleAddPmExercise}>
            <h4>Adicionar exercício</h4>
            <label>
              Exercício
              <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                <option value="" disabled>
                  Selecione um exercício
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
              Adicionar bloco PM
            </button>
          </form>
        </div>

        <div className="training-config__preview">
          {splitOrder.map((split) => (
            <TrainingDay
              key={split}
              split={split}
              splitLabel={preferences.splitLabels[split] ?? defaultSplitLabels[split]}
              plan={template[split]}
              catalog={catalog}
              cardioCatalog={cardioCatalog}
              onRemoveCardio={(id) => removeAmBlock(split, id)}
              onUpdateCardio={(id, payload) => updateAmBlock(split, id, payload)}
              onRemoveExercise={(id) => removePmExercise(split, id)}
              onUpdateExercise={(id, payload) => updatePmExercise(split, id, payload)}
              onMoveExercise={(id, direction) => movePmExercise(split, id, direction)}
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
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  align-items: stretch;
}
.training-config__catalogItem {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 14px;
  padding: 12px;
  background: rgba(248, 250, 252, 0.7);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 140px;
}
.training-config__catalogItem > div:first-of-type {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.training-config__catalogSubtitle {
  display: block;
  font-size: 0.85rem;
  color: #475569;
}
.training-config__catalogLink {
  font-size: 0.8rem;
  color: #1d4ed8;
}
.training-config__catalogActions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}
.training-config__catalogActions button {
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 4px 10px;
  font-size: 0.85rem;
  line-height: 1.1;
}
.training-config__catalogRemove {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.3);
}
.training-config__editForm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.training-config__editForm label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.training-config__editActions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.training-config__grid--assign {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  align-items: start;
}
.training-config__grid--labels {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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