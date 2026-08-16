import { useCallback, useEffect, useMemo, useState } from "react";
import { playTrainingRestSound, primeTrainingAudio, type TrainingRestSound } from "./training.audio";

type ExerciseTimerPhase = "working" | "work-paused" | "resting" | "rest-paused";

type ExerciseTimerSession = {
  phase: ExerciseTimerPhase;
  updatedAt: number;
  seriesStartedAt?: number;
  seriesElapsedSec?: number;
  restEndsAt?: number;
  restRemainingSec?: number;
  context?: {
    targetExerciseId?: string;
    durationSec?: number;
  };
};

type TimerStore = Record<string, ExerciseTimerSession>;

type TimerSyncDetail = {
  exerciseId: string;
  session: ExerciseTimerSession | null;
};

const storageKey = "tr:exerciseTimers:v1";
const timerSyncEvent = "fitapp:exercise-timer-sync";
const maximumSessionAgeMs = 12 * 60 * 60 * 1000;

export function useExerciseTimer(exerciseId: string, completionSound?: TrainingRestSound | null) {
  const [session, setSession] = useState<ExerciseTimerSession | null>(() =>
    readSession(exerciseId),
  );
  const [now, setNow] = useState(Date.now());

  const updateSession = useCallback(
    (next: ExerciseTimerSession | null) => {
      setSession(next);
      writeSession(exerciseId, next);
      setNow(Date.now());
    },
    [exerciseId],
  );

  useEffect(() => {
    if (session?.phase !== "working" && session?.phase !== "resting") return;
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [session?.phase]);

  useEffect(() => {
    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent<TimerSyncDetail>).detail;
      if (!detail || detail.exerciseId !== exerciseId) return;
      setSession(detail.session);
      setNow(Date.now());
    };
    window.addEventListener(timerSyncEvent, handleSync);
    return () => window.removeEventListener(timerSyncEvent, handleSync);
  }, [exerciseId]);

  const seriesElapsedSec = useMemo(() => {
    if (!session) return 0;
    const saved = session.seriesElapsedSec ?? 0;
    if (session.phase !== "working" || !session.seriesStartedAt) return saved;
    return saved + Math.max(0, Math.floor((now - session.seriesStartedAt) / 1000));
  }, [now, session]);

  const restRemainingSec = useMemo(() => {
    if (!session) return 0;
    if (session.phase === "rest-paused") return session.restRemainingSec ?? 0;
    if (session.phase !== "resting" || !session.restEndsAt) return 0;
    return Math.max(0, Math.ceil((session.restEndsAt - now) / 1000));
  }, [now, session]);

  useEffect(() => {
    if (session?.phase === "resting" && restRemainingSec <= 0) {
      const shouldPlaySound = clearSessionIfCurrent(exerciseId, session);
      if (!shouldPlaySound) setSession(null);
      if (shouldPlaySound && completionSound) playTrainingRestSound(completionSound);
    }
  }, [completionSound, exerciseId, restRemainingSec, session]);

  const startSeries = () =>
    updateSession({
      phase: "working",
      updatedAt: Date.now(),
      seriesStartedAt: Date.now(),
      seriesElapsedSec: 0,
    });

  const pauseSeries = () =>
    updateSession({
      phase: "work-paused",
      updatedAt: Date.now(),
      seriesElapsedSec,
    });

  const resumeSeries = () =>
    updateSession({
      phase: "working",
      updatedAt: Date.now(),
      seriesStartedAt: Date.now(),
      seriesElapsedSec,
    });

  const restartSeries = () =>
    updateSession({
      phase: "working",
      updatedAt: Date.now(),
      seriesStartedAt: Date.now(),
      seriesElapsedSec: 0,
    });

  const startRest = (seconds: number, context?: ExerciseTimerSession["context"]) => {
    if (completionSound) primeTrainingAudio();
    updateSession({
      phase: "resting",
      updatedAt: Date.now(),
      restEndsAt: Date.now() + Math.max(0, seconds) * 1000,
      context,
    });
  };

  const pauseRest = () =>
    updateSession({
      phase: "rest-paused",
      updatedAt: Date.now(),
      restRemainingSec,
      context: session?.context,
    });

  const resumeRest = () =>
    updateSession({
      phase: "resting",
      updatedAt: Date.now(),
      restEndsAt: Date.now() + restRemainingSec * 1000,
      context: session?.context,
    });

  const clearTimer = useCallback(() => updateSession(null), [updateSession]);

  return {
    phase: session?.phase ?? null,
    seriesElapsedSec,
    restRemainingSec,
    context: session?.context,
    startSeries,
    pauseSeries,
    resumeSeries,
    restartSeries,
    startRest,
    pauseRest,
    resumeRest,
    clearTimer,
  };
}

export function startExerciseTimer(exerciseId: string) {
  const now = Date.now();
  const session: ExerciseTimerSession = {
    phase: "working",
    updatedAt: now,
    seriesStartedAt: now,
    seriesElapsedSec: 0,
  };
  writeSession(exerciseId, session);
}

function readTimerStore(): TimerStore {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}") as TimerStore;
  } catch {
    return {};
  }
}

function readSession(exerciseId: string) {
  const session = readTimerStore()[exerciseId];
  if (!session || Date.now() - session.updatedAt > maximumSessionAgeMs) return null;
  if (session.phase === "resting" && (session.restEndsAt ?? 0) <= Date.now()) return null;
  return session;
}

function writeSession(exerciseId: string, session: ExerciseTimerSession | null) {
  try {
    const store = readTimerStore();
    if (session) store[exerciseId] = session;
    else delete store[exerciseId];
    localStorage.setItem(storageKey, JSON.stringify(store));
    window.dispatchEvent(
      new CustomEvent<TimerSyncDetail>(timerSyncEvent, {
        detail: { exerciseId, session },
      }),
    );
  } catch {
    // O treino continua funcionando mesmo se o armazenamento estiver indisponível.
  }
}

function clearSessionIfCurrent(exerciseId: string, completedSession: ExerciseTimerSession) {
  const currentSession = readTimerStore()[exerciseId];
  if (
    currentSession?.phase !== "resting"
    || currentSession.updatedAt !== completedSession.updatedAt
  ) return false;
  writeSession(exerciseId, null);
  return true;
}
