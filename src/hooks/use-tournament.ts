"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateSwissRound } from "@/lib/tournament/pairing";
import {
  computeStandings,
  hasIncompleteResults,
  lastRound,
} from "@/lib/tournament/standings";
import {
  clearTournament,
  loadTournament,
  saveTournament,
} from "@/lib/tournament/storage";
import {
  emptyTournament,
  newId,
  type PodResult,
  type TournamentState,
} from "@/lib/tournament/types";

export function useTournament() {
  const [state, setState] = useState<TournamentState>(emptyTournament);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setState(loadTournament());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveTournament(state);
  }, [state, hydrated]);

  const standings = useMemo(() => computeStandings(state), [state]);

  const update = useCallback((fn: (prev: TournamentState) => TournamentState) => {
    setError(null);
    setState((prev) => fn(prev));
  }, []);

  const addPlayer = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Digite um nome.");
        return false;
      }
      if (
        state.players.some(
          (p) => p.name.toLocaleLowerCase("pt-BR") === trimmed.toLocaleLowerCase("pt-BR"),
        )
      ) {
        setError("Já existe um jogador com esse nome.");
        return false;
      }
      update((prev) => ({
        ...prev,
        players: [...prev.players, { id: newId(), name: trimmed }],
      }));
      return true;
    },
    [state.players, update],
  );

  const renamePlayer = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Nome não pode ficar vazio.");
        return false;
      }
      update((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === id ? { ...p, name: trimmed } : p,
        ),
      }));
      return true;
    },
    [update],
  );

  const removePlayer = useCallback(
    (id: string) => {
      if (state.rounds.length > 0) {
        setError(
          "Não dá para remover jogadores depois que as rodadas começaram. Zere o torneio se precisar recomeçar.",
        );
        return false;
      }
      update((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
      }));
      return true;
    },
    [state.rounds.length, update],
  );

  const generateRound = useCallback(() => {
    setWarning(null);
    const last = lastRound(state);
    if (last && hasIncompleteResults(last)) {
      setError(
        "Finalize os resultados da rodada atual antes de gerar a próxima.",
      );
      return;
    }
    try {
      const { round, warning: w } = generateSwissRound(state);
      setWarning(w ?? null);
      update((prev) => ({ ...prev, rounds: [...prev.rounds, round] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar rodada.");
    }
  }, [state, update]);

  const setPodResult = useCallback(
    (roundId: string, podId: string, result: PodResult | null) => {
      update((prev) => ({
        ...prev,
        rounds: prev.rounds.map((r) => {
          if (r.id !== roundId) return r;
          return {
            ...r,
            pods: r.pods.map((p) => {
              if (p.id !== podId) return p;
              if (result === null) {
                const { result: _drop, ...rest } = p;
                void _drop;
                return rest;
              }
              return { ...p, result };
            }),
          };
        }),
      }));
    },
    [update],
  );

  const deleteLastRound = useCallback(() => {
    update((prev) => ({
      ...prev,
      rounds: prev.rounds.slice(0, -1),
    }));
    setWarning(null);
  }, [update]);

  const resetAll = useCallback(() => {
    clearTournament();
    setState(emptyTournament());
    setError(null);
    setWarning(null);
  }, []);

  return {
    state,
    hydrated,
    error,
    warning,
    standings,
    addPlayer,
    renamePlayer,
    removePlayer,
    generateRound,
    setPodResult,
    deleteLastRound,
    resetAll,
    clearError: () => setError(null),
  };
}
