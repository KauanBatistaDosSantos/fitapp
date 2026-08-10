import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { defaultSplitLabels, useTraining } from "./training.store";
import { getActiveSplits, splitOrder } from "./training.service";
import { normalizeExerciseName, parseExerciseText } from "./training.import";
import type { CardioPlacement, Split } from "./training.schema";
import { TrainingDay } from "./TrainingDay";
import {
  createSharedTrainingPlan,
  parseSharedTrainingPlan,
  sharedPlanFilename,
  type SharedTrainingPlan,
} from "./training.share";
import { normalizeMediaUrls, parseMediaUrls, resolveExerciseMedia } from "./training.media";
import { TrainingMediaGallery } from "./TrainingMediaGallery";
import { MuscleBadge } from "./MuscleBadge";
import { muscleAccentStyle } from "./training.muscles";

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
    moveExerciseToSplit,
    reorderTrainingSplit,
    setPreferences,
    importSharedPlan,
  } = useTraining();

  const [newExercise, setNewExercise] = useState({
    name: "",
    muscle: "",
    mediaUrls: "",
    secondary: "",
    substitutions: [] as string[],
  });
  const [newCardio, setNewCardio] = useState("");
  const [bulkExerciseText, setBulkExerciseText] = useState("");
  const [bulkImportMessage, setBulkImportMessage] = useState("");
  const [selectedSplit, setSelectedSplit] = useState<Split>("A");
  const [cardioKind, setCardioKind] = useState(cardioCatalog[0]?.kind ?? "");
  const [cardioMinutes, setCardioMinutes] = useState("30");
  const [cardioPlacement, setCardioPlacement] = useState<CardioPlacement>("before");
  const [cardioAfterExerciseId, setCardioAfterExerciseId] = useState("");
  const [exerciseId, setExerciseId] = useState(catalog[0]?.id ?? "");
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("12");
  const [rest, setRest] = useState("60");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingSplit, setDraggingSplit] = useState<Split | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState<"organize" | "builder" | "library" | "share">("organize");
  const [shareTitle, setShareTitle] = useState("Meu treino");
  const [shareMessage, setShareMessage] = useState("");
  const [pendingSharedPlan, setPendingSharedPlan] = useState<SharedTrainingPlan | null>(null);
  const [shareError, setShareError] = useState("");
  const [editingForm, setEditingForm] = useState({ name: "", muscle: "", mediaUrls: "", secondary: "", substitutions: [] as string[] });
  const activeSplits = useMemo(
    () => getActiveSplits(preferences.trainingDays),
    [preferences.trainingDays],
  );
  const cardioAnchorOptions = useMemo(
    () => template[selectedSplit].pm.slice(0, -1),
    [selectedSplit, template],
  );
  const parsedExercises = useMemo(
    () => parseExerciseText(bulkExerciseText),
    [bulkExerciseText],
  );
  const catalogNames = useMemo(
    () => new Set(catalog.map((item) => normalizeExerciseName(item.name))),
    [catalog],
  );
  const catalogByName = useMemo(
    () => new Map(catalog.map((item) => [normalizeExerciseName(item.name), item])),
    [catalog],
  );
  const newParsedExercises = useMemo(
    () => parsedExercises.filter((exercise) => !catalogNames.has(normalizeExerciseName(exercise.name))),
    [catalogNames, parsedExercises],
  );
  const importableParsedExercises = useMemo(
    () =>
      parsedExercises.filter((exercise) => {
        const existing = catalogByName.get(normalizeExerciseName(exercise.name));
        if (!existing) return true;
        return normalizeMediaUrls(
          exercise.mediaUrls,
        ).some((url) => !resolveExerciseMedia(undefined, existing).includes(url));
      }),
    [catalogByName, parsedExercises],
  );

  const handleSplitLabelChange = (split: Split, value: string) => {
    setPreferences({
      splitLabels: {
        ...preferences.splitLabels,
        [split]: value,
      },
    });
  };

  const handleReorderSplit = (from: Split, to: Split) => {
    if (from === to) return;
    const reorderedSources = [...splitOrder];
    const [moved] = reorderedSources.splice(splitOrder.indexOf(from), 1);
    reorderedSources.splice(splitOrder.indexOf(to), 0, moved);
    const selectedDestination = splitOrder[reorderedSources.indexOf(selectedSplit)];

    reorderTrainingSplit(from, to);
    setSelectedSplit(
      getActiveSplits(preferences.trainingDays).includes(selectedDestination)
        ? selectedDestination
        : activeSplits[0],
    );
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
      const firstExercise = catalog[0];
      setExerciseId(firstExercise.id);
      if (firstExercise.defaultSets) setSets(String(firstExercise.defaultSets));
      if (firstExercise.defaultReps) setReps(firstExercise.defaultReps);
    }
  }, [catalog, exerciseId]);

  useEffect(() => {
    if (!activeSplits.includes(selectedSplit)) {
      setSelectedSplit(activeSplits[0]);
    }
  }, [activeSplits, selectedSplit]);

  useEffect(() => {
    if (cardioPlacement !== "between") return;
    if (cardioAnchorOptions.length === 0) {
      setCardioPlacement("before");
      setCardioAfterExerciseId("");
      return;
    }
    if (!cardioAnchorOptions.some((exercise) => exercise.id === cardioAfterExerciseId)) {
      setCardioAfterExerciseId(cardioAnchorOptions[0].id);
    }
  }, [cardioAfterExerciseId, cardioAnchorOptions, cardioPlacement]);

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
      mediaUrls: parseMediaUrls(newExercise.mediaUrls),
      secondaryMuscles: secondary,
      substitutions: newExercise.substitutions,
      muscles: [newExercise.muscle.trim(), ...secondary],
    });
    setNewExercise({ name: "", muscle: "", mediaUrls: "", secondary: "", substitutions: [] });
  };

  const handleBulkImport = () => {
    if (importableParsedExercises.length === 0) return;
    let added = 0;
    let updated = 0;
    importableParsedExercises.forEach((exercise) => {
      const existing = catalogByName.get(normalizeExerciseName(exercise.name));
      if (existing) {
        updateCatalogExercise(existing.id, {
          mediaUrls: normalizeMediaUrls(
            resolveExerciseMedia(undefined, existing),
            exercise.mediaUrls,
          ),
        });
        updated += 1;
      } else {
        addCatalogExercise({
          name: exercise.name,
          muscle: exercise.muscle,
          muscles: [exercise.muscle],
          defaultSets: exercise.sets,
          defaultReps: exercise.reps,
          mediaUrls: exercise.mediaUrls,
        });
        added += 1;
      }
    });
    const result = [
      added ? `${added} ${added === 1 ? "exercício adicionado" : "exercícios adicionados"}` : "",
      updated ? `${updated} ${updated === 1 ? "exercício atualizado" : "exercícios atualizados"} com novas imagens` : "",
    ].filter(Boolean);
    setBulkImportMessage(`${result.join(" e ")}.`);
    setBulkExerciseText("");
  };

  const handleExerciseSelection = (id: string) => {
    setExerciseId(id);
    const selected = catalog.find((item) => item.id === id);
    if (selected?.defaultSets) setSets(String(selected.defaultSets));
    if (selected?.defaultReps) setReps(selected.defaultReps);
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
    addAmBlock(
      selectedSplit,
      cardioKind,
      Number(cardioMinutes) || 20,
      cardioPlacement,
      cardioPlacement === "between" ? cardioAfterExerciseId : undefined,
    );
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
      mediaUrls: resolveExerciseMedia(undefined, item).join("\n"),
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
      mediaUrls: parseMediaUrls(editingForm.mediaUrls),
      secondaryMuscles: secondary,
      substitutions: editingForm.substitutions,
      muscles: [editingForm.muscle.trim(), ...secondary],
    });
    setEditingId(null);
  };

  const buildShareFile = () => {
    const plan = createSharedTrainingPlan(shareTitle, template, preferences, catalog);
    return new File(
      [JSON.stringify(plan, null, 2)],
      sharedPlanFilename(plan.title),
      { type: "application/json" },
    );
  };

  const handleDownloadPlan = () => {
    const file = buildShareFile();
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    setShareMessage("Arquivo do treino exportado. Agora você pode enviá-lo como anexo.");
    setShareError("");
  };

  const handleSharePlan = async () => {
    const file = buildShareFile();
    const shareData = {
      title: shareTitle.trim() || "Meu treino",
      text: "Importe este treino no FitApp.",
      files: [file],
    };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareMessage("Treino enviado pelo compartilhamento do dispositivo.");
        setShareError("");
        return;
      }
      handleDownloadPlan();
      setShareMessage("O compartilhamento direto não está disponível neste navegador. O arquivo foi baixado para você enviar.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareError("Não foi possível abrir o compartilhamento. Você ainda pode baixar o arquivo.");
    }
  };

  const handleSharedFile = async (file?: File) => {
    setPendingSharedPlan(null);
    setShareMessage("");
    setShareError("");
    if (!file) return;
    if (file.size > 2_000_000) {
      setShareError("O arquivo é muito grande. Escolha um arquivo de treino do FitApp com até 2 MB.");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      setPendingSharedPlan(parseSharedTrainingPlan(parsed));
    } catch {
      setShareError("Este arquivo não é um treino válido do FitApp ou está danificado.");
    }
  };

  const handleConfirmSharedPlan = () => {
    if (!pendingSharedPlan) return;
    const confirmed = window.confirm(
      `Importar “${pendingSharedPlan.title}”? Sua divisão atual será substituída e o progresso da semana será reiniciado.`,
    );
    if (!confirmed) return;
    importSharedPlan(pendingSharedPlan);
    setShareTitle(pendingSharedPlan.title);
    setPendingSharedPlan(null);
    setShareError("");
    setShareMessage("Treino importado. A divisão e a biblioteca já estão prontas para uso.");
  };

  return (
    <div className="app-card">
      <div className="training-config__tabsBar">
        <div className="training-config__tabs" role="tablist" aria-label="Seções da configuração de treinos">
          {[
            { id: "organize", label: "Organizar" },
            { id: "builder", label: "Montar treino" },
            { id: "library", label: "Biblioteca" },
            { id: "share", label: "Compartilhar" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeConfigTab === tab.id}
              className={`training-config__tab ${
                activeConfigTab === tab.id ? "training-config__tab--active" : ""
              }`}
              onClick={() => setActiveConfigTab(tab.id as typeof activeConfigTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link to="/training" className="training-config__backLink">Voltar para os treinos</Link>
      </div>

      {activeConfigTab === "library" && (
      <Section
        title="Biblioteca de exercícios"
        description="Cadastre variações para montar a divisão do jeito que preferir."
      >
        <div className="training-config__bulkImport">
          <div>
            <h3>Importar exercícios por texto</h3>
            <p>
              Cole uma lista com nomes, séries, repetições e links. O app reconhece formatos como
              <strong> 4×6–10</strong>, <strong>3x12</strong> e <strong>3x30-60 segundos</strong>.
            </p>
          </div>
          <textarea
            value={bulkExerciseText}
            onChange={(event) => {
              setBulkExerciseText(event.target.value);
              setBulkImportMessage("");
            }}
            rows={8}
            placeholder={"Supino reto com halteres\t4×6–10\thttps://exemplo.com/supino\nRemada baixa\t3×8–12"}
          />

          {bulkExerciseText.trim() && (
            <div className="training-config__importPreview">
              <div className="training-config__importSummary">
                <strong>{parsedExercises.length} exercício(s) reconhecido(s)</strong>
                <span>
                  {newParsedExercises.length} novo(s)
                  {importableParsedExercises.length > newParsedExercises.length
                    ? ` · ${importableParsedExercises.length - newParsedExercises.length} com novas imagens`
                    : ""}
                  {parsedExercises.length > importableParsedExercises.length
                    ? ` · ${parsedExercises.length - importableParsedExercises.length} sem alterações`
                    : ""}
                </span>
              </div>
              {parsedExercises.length > 0 ? (
                <ul>
                  {parsedExercises.map((exercise) => {
                    const existing = catalogByName.get(normalizeExerciseName(exercise.name));
                    const hasNewMedia = exercise.mediaUrls?.some(
                      (url) => !resolveExerciseMedia(undefined, existing).includes(url),
                    );
                    const duplicate = Boolean(existing && !hasNewMedia);
                    return (
                      <li key={normalizeExerciseName(exercise.name)} className={duplicate ? "training-config__importDuplicate" : ""}>
                        <div>
                          <strong>{exercise.name}</strong>
                          <span>{exercise.muscle}</span>
                          {exercise.mediaUrls?.length ? (
                            <span>
                              {exercise.mediaUrls.length} {exercise.mediaUrls.length === 1 ? "imagem incluída" : "imagens incluídas"}
                            </span>
                          ) : null}
                        </div>
                        <span>
                          {exercise.sets && exercise.reps
                            ? `${exercise.sets} × ${exercise.reps}`
                            : "Sem padrão de séries"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="training-config__importEmpty">
                  Ainda não foi possível identificar exercícios. Separe os itens por linha, tabulação ou ponto e vírgula.
                </p>
              )}
            </div>
          )}

          <div className="training-config__bulkActions">
            <button type="button" onClick={handleBulkImport} disabled={importableParsedExercises.length === 0}>
              Importar {importableParsedExercises.length || ""} para a biblioteca
            </button>
            {bulkExerciseText && (
              <button type="button" className="training-config__bulkClear" onClick={() => setBulkExerciseText("")}>
                Limpar
              </button>
            )}
          </div>
          {bulkImportMessage && <p className="training-config__importSuccess">{bulkImportMessage}</p>}
        </div>

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
            Imagens e GIFs de referência
            <textarea
              value={newExercise.mediaUrls}
              onChange={(e) => setNewExercise((prev) => ({ ...prev, mediaUrls: e.target.value }))}
              placeholder={"Cole um link por linha\nhttps://...\nhttps://..."}
              rows={3}
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
            <div
              key={item.id}
              className="training-config__catalogItem"
              style={muscleAccentStyle(item.muscle)}
            >
              <div>
                <strong>{item.name}</strong>
                <div className="training-config__catalogMuscles">
                  {Array.from(new Set([item.muscle, ...(item.secondaryMuscles ?? [])]))
                    .filter(Boolean)
                    .map((muscle) => <MuscleBadge key={muscle} muscle={muscle} />)}
                </div>
                {item.defaultSets && item.defaultReps && (
                  <span className="training-config__catalogSubtitle">
                    Padrão: {item.defaultSets} × {item.defaultReps}
                  </span>
                )}
                {resolveExerciseMedia(undefined, item).length > 0 && (
                  <TrainingMediaGallery
                    exerciseName={item.name}
                    urls={resolveExerciseMedia(undefined, item)}
                    variant="catalog"
                  />
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
                    Imagens e GIFs de referência
                    <textarea
                      value={editingForm.mediaUrls}
                      onChange={(e) => setEditingForm((prev) => ({ ...prev, mediaUrls: e.target.value }))}
                      placeholder={"Um link por linha\nhttps://..."}
                      rows={4}
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
      )}

      {activeConfigTab === "organize" && (
      <Section
        title="Identificar treinos"
        description="Escolha como cada dia da divisão será apresentado nos treinos e no acompanhamento semanal."
      >
        <label className="training-config__days">
          Dias de treino por semana
          <select
            value={preferences.trainingDays}
            onChange={(event) => setPreferences({ trainingDays: Number(event.target.value) })}
          >
            {[2, 3, 4, 5, 6, 7].map((days) => (
              <option key={days} value={days}>
                {days} dias
              </option>
            ))}
          </select>
          <small>Os dias ocultos continuam salvos se a quantidade aumentar novamente.</small>
        </label>
        <div className="training-config__organizer">
          <div className="training-config__organizerHeader">
            <strong>Ordem dos treinos</strong>
            <span>Arraste para escolher quais ficam nas vagas ativas.</span>
          </div>
          <div className="training-config__organizerList">
            {splitOrder.map((split, index) => {
              const isActive = index < preferences.trainingDays;
              const label = (preferences.splitLabels[split] ?? "").trim();
              const blocks = template[split].am.length + template[split].pm.length;
              return (
                <div
                  key={split}
                  draggable
                  className={`training-config__organizerItem ${
                    isActive ? "training-config__organizerItem--active" : ""
                  } ${draggingSplit === split ? "training-config__organizerItem--dragging" : ""}`}
                  onDragStart={(event) => {
                    setDraggingSplit(split);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", split);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = draggingSplit ?? (event.dataTransfer.getData("text/plain") as Split);
                    if (from) handleReorderSplit(from, split);
                    setDraggingSplit(null);
                  }}
                  onDragEnd={() => setDraggingSplit(null)}
                >
                  <span className="training-config__dragHandle" aria-hidden="true">::</span>
                  <span className="training-config__organizerPosition">Treino {split}</span>
                  <span className="training-config__organizerName">{label || "Sem nome"}</span>
                  <small>{blocks} {blocks === 1 ? "bloco" : "blocos"}</small>
                  <span className={`training-config__organizerStatus ${
                    isActive ? "training-config__organizerStatus--active" : ""
                  }`}>
                    {isActive ? "Ativo" : "Oculto"}
                  </span>
                  <div className="training-config__organizerActions">
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label={`Mover treino ${split} para cima`}
                      onClick={() => handleReorderSplit(split, splitOrder[index - 1])}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      disabled={index === splitOrder.length - 1}
                      aria-label={`Mover treino ${split} para baixo`}
                      onClick={() => handleReorderSplit(split, splitOrder[index + 1])}
                    >
                      Descer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <small className="training-config__organizerHint">
            Ao mover, nome, cardio, exercicios e progresso acompanham o treino. As letras mudam conforme a nova posicao.
          </small>
        </div>
        <div className="training-config__grid training-config__grid--labels">
          {activeSplits.map((split) => (
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
      )}

      {activeConfigTab === "builder" && (
      <Section title="Montar divisão" description="Escolha a ordem dos exercícios e onde cada cardio entra na sequência.">
        <div className="training-config__grid training-config__grid--assign">
          <label>
            Divisão
            <select value={selectedSplit} onChange={(e) => setSelectedSplit(e.target.value as Split)}>
              {activeSplits.map((split) => (
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
            <label>
              Posição no treino
              <select
                value={cardioPlacement}
                onChange={(e) => setCardioPlacement(e.target.value as CardioPlacement)}
              >
                <option value="before">Antes da musculação</option>
                <option value="between" disabled={cardioAnchorOptions.length === 0}>Entre exercícios</option>
                <option value="after">Depois da musculação</option>
              </select>
            </label>
            {cardioPlacement === "between" && cardioAnchorOptions.length > 0 && (
              <label>
                Inserir depois de
                <select
                  value={cardioAfterExerciseId}
                  onChange={(e) => setCardioAfterExerciseId(e.target.value)}
                >
                  {cardioAnchorOptions.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                  ))}
                </select>
              </label>
            )}
            <button type="submit" disabled={!cardioKind}>
              Adicionar cardio
            </button>
          </form>
          <form className="training-config__subform" onSubmit={handleAddPmExercise}>
            <h4>Adicionar exercício</h4>
            <label>
              Exercício
              <select value={exerciseId} onChange={(e) => handleExerciseSelection(e.target.value)}>
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
              Adicionar exercício
            </button>
          </form>
        </div>

        <div className="training-config__preview">
          {activeSplits.map((split) => (
            <TrainingDay
              key={split}
              split={split}
              splitLabel={preferences.splitLabels[split] ?? defaultSplitLabels[split]}
              plan={template[split]}
              availableSplits={activeSplits}
              catalog={catalog}
              cardioCatalog={cardioCatalog}
              onRemoveCardio={(id) => removeAmBlock(split, id)}
              onUpdateCardio={(id, payload) => updateAmBlock(split, id, payload)}
              onRemoveExercise={(id) => removePmExercise(split, id)}
              onUpdateExercise={(id, payload) => updatePmExercise(split, id, payload)}
              onMoveExercise={(id, direction) => movePmExercise(split, id, direction)}
              onMoveExerciseToSplit={(id, target) => moveExerciseToSplit(split, target, id)}
            />
          ))}
        </div>
      </Section>
      )}

      {activeConfigTab === "share" && (
        <Section
          title="Compartilhar treinos"
          description="Envie sua divisão para outra pessoa ou importe um treino recebido."
        >
          <div className="training-config__shareGrid">
            <article className="training-config__shareCard">
              <div>
                <span className="training-config__shareEyebrow">EXPORTAR</span>
                <h3>Enviar meu treino</h3>
                <p>
                  O arquivo inclui os {preferences.trainingDays} treinos ativos, exercícios,
                  séries, repetições, descanso, cardio e links de referência.
                </p>
              </div>
              <label>
                Nome do plano
                <input
                  value={shareTitle}
                  maxLength={100}
                  onChange={(event) => setShareTitle(event.target.value)}
                  placeholder="Ex: Hipertrofia 4 dias"
                />
              </label>
              <div className="training-config__shareActions">
                <button type="button" onClick={handleSharePlan}>
                  Enviar treino
                </button>
                <button type="button" className="training-config__shareSecondary" onClick={handleDownloadPlan}>
                  Baixar arquivo
                </button>
              </div>
              <small>
                Cargas utilizadas, histórico e progresso semanal não são compartilhados.
              </small>
            </article>

            <article className="training-config__shareCard">
              <div>
                <span className="training-config__shareEyebrow">IMPORTAR</span>
                <h3>Recebi um treino</h3>
                <p>Selecione o arquivo <strong>.fitapp.json</strong> enviado por outra pessoa.</p>
              </div>
              <label className="training-config__filePicker">
                Escolher arquivo
                <input
                  type="file"
                  accept=".json,.fitapp.json,application/json"
                  onChange={(event) => void handleSharedFile(event.target.files?.[0])}
                />
              </label>

              {pendingSharedPlan && (
                <div className="training-config__sharePreview">
                  <strong>{pendingSharedPlan.title}</strong>
                  <span>
                    {pendingSharedPlan.workouts.length} treinos ·{" "}
                    {pendingSharedPlan.workouts.reduce(
                      (total, workout) => total + workout.exercises.length,
                      0,
                    )} exercícios ·{" "}
                    {pendingSharedPlan.workouts.reduce(
                      (total, workout) =>
                        total + workout.exercises.reduce(
                          (exerciseTotal, exercise) =>
                            exerciseTotal +
                            normalizeMediaUrls(exercise.mediaUrls, exercise.gifUrl).length,
                          0,
                        ),
                      0,
                    )} links
                  </span>
                  <ul>
                    {pendingSharedPlan.workouts.map((workout, index) => (
                      <li key={`${workout.label}-${index}`}>
                        <span>Treino {splitOrder[index]} · {workout.label}</span>
                        <small>{workout.exercises.length} exercícios</small>
                      </li>
                    ))}
                  </ul>
                  <p>
                    A importação substitui sua divisão atual, reinicia o acompanhamento semanal
                    e mantém os exercícios que já existem na sua biblioteca.
                  </p>
                  <button type="button" onClick={handleConfirmSharedPlan}>
                    Confirmar e importar
                  </button>
                </div>
              )}
            </article>
          </div>

          {shareMessage && <p className="training-config__shareNotice">{shareMessage}</p>}
          {shareError && <p className="training-config__shareError" role="alert">{shareError}</p>}
        </Section>
      )}
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-config__bulkImport {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 18px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 16px;
  background: rgba(239, 246, 255, 0.72);
}
.training-config__bulkImport h3,
.training-config__bulkImport p {
  margin: 0;
}
.training-config__bulkImport p {
  color: #475569;
}
.training-config__bulkImport textarea {
  width: 100%;
  resize: vertical;
  min-height: 150px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: 12px;
  background: white;
  color: #0f172a;
  font: inherit;
}
.training-config__importPreview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 340px;
  overflow: auto;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
}
.training-config__importSummary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.training-config__importSummary span {
  color: #64748b;
  font-size: 0.85rem;
}
.training-config__importPreview ul {
  display: grid;
  gap: 6px;
}
.training-config__importPreview li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  background: white;
}
.training-config__importPreview li > div {
  min-width: 0;
}
.training-config__importPreview li span {
  color: #64748b;
  font-size: 0.82rem;
}
.training-config__importPreview li > div span {
  display: block;
}
.training-config__importDuplicate {
  opacity: 0.55;
}
.training-config__importEmpty {
  color: #b45309;
}
.training-config__bulkActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.training-config__bulkClear {
  border-color: rgba(148, 163, 184, 0.45);
  background: transparent;
  color: #475569;
}
.training-config__importSuccess {
  color: #15803d !important;
  font-weight: 700;
}
.training-config__tabsBar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: -4px 0 20px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 28px -24px rgba(15, 23, 42, 0.6);
}
.training-config__tabs {
  display: flex;
  gap: 6px;
  min-width: 0;
}
.training-config__tab {
  border: 0;
  border-radius: 10px;
  padding: 9px 14px;
  background: transparent;
  color: #475569;
  font-weight: 700;
  white-space: nowrap;
}
.training-config__tab--active {
  background: #dbeafe;
  color: #1d4ed8;
}
.training-config__backLink {
  flex-shrink: 0;
  color: #1d4ed8;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
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
.training-config__days {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
  margin-bottom: 18px;
}
.training-config__days small {
  color: #64748b;
  font-weight: 400;
}
.training-config__organizer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 22px;
}
.training-config__organizerHeader {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.training-config__organizerHeader span,
.training-config__organizerHint {
  color: #64748b;
}
.training-config__organizerList {
  display: grid;
  gap: 8px;
}
.training-config__organizerItem {
  display: grid;
  grid-template-columns: auto minmax(78px, auto) minmax(120px, 1fr) auto auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px dashed rgba(148, 163, 184, 0.55);
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.7);
  cursor: grab;
}
.training-config__organizerItem--active {
  border-style: solid;
  border-color: rgba(37, 99, 235, 0.35);
  background: rgba(239, 246, 255, 0.9);
}
.training-config__organizerItem--dragging {
  opacity: 0.45;
}
.training-config__dragHandle {
  color: #64748b;
  font-weight: 800;
  letter-spacing: -3px;
}
.training-config__organizerPosition {
  font-weight: 700;
}
.training-config__organizerName {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.training-config__organizerItem > small {
  color: #64748b;
}
.training-config__organizerStatus {
  border-radius: 999px;
  padding: 3px 8px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
}
.training-config__organizerStatus--active {
  background: #dbeafe;
  color: #1d4ed8;
}
.training-config__organizerActions {
  display: flex;
  gap: 6px;
}
.training-config__organizerActions button {
  padding: 4px 8px;
  font-size: 0.75rem;
}
.training-config__organizerActions button:disabled {
  opacity: 0.35;
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
  border-left: 5px solid var(--muscle-color, #94a3b8);
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
.training-config__catalogMuscles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.training-config__shareGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.training-config__shareCard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.75);
}
.training-config__shareCard h3,
.training-config__shareCard p {
  margin: 0;
}
.training-config__shareCard p,
.training-config__shareCard small {
  color: #64748b;
}
.training-config__shareCard label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 700;
}
.training-config__shareEyebrow {
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.training-config__shareActions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.training-config__shareSecondary,
.training-config__filePicker {
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: transparent !important;
  color: #1d4ed8 !important;
}
.training-config__filePicker {
  display: inline-flex !important;
  align-items: center;
  align-self: flex-start;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
}
.training-config__filePicker input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}
.training-config__sharePreview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(37, 99, 235, 0.28);
  border-radius: 12px;
  background: rgba(219, 234, 254, 0.5);
}
.training-config__sharePreview > span {
  color: #475569;
  font-size: 0.9rem;
}
.training-config__sharePreview ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.training-config__sharePreview li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.75);
}
.training-config__sharePreview p {
  font-size: 0.85rem;
}
.training-config__shareNotice,
.training-config__shareError {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  font-weight: 700;
}
.training-config__shareNotice {
  background: rgba(220, 252, 231, 0.8);
  color: #15803d;
}
.training-config__shareError {
  background: rgba(254, 226, 226, 0.8);
  color: #b91c1c;
}
@media (min-width: 1024px) {
  .training-config__preview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .training-config__shareGrid {
    grid-template-columns: 1fr;
  }
  .training-config__tabsBar {
    align-items: stretch;
    flex-direction: column;
  }
  .training-config__tabs {
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .training-config__tab {
    flex: 1 0 auto;
  }
  .training-config__backLink {
    padding: 0 6px 4px;
  }
  .training-config__organizerItem {
    grid-template-columns: auto auto 1fr auto;
  }
  .training-config__organizerItem > small {
    display: none;
  }
  .training-config__organizerStatus {
    grid-column: 2;
  }
  .training-config__organizerActions {
    grid-column: 3 / -1;
    justify-content: flex-end;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}
