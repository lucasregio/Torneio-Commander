"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadOrgSession,
  loadSelfPlayerId,
  saveOrgSession,
  saveSelfPlayerId,
  verifyOrgPin,
} from "@/lib/tournament/org";
import { generateSwissRound } from "@/lib/tournament/pairing";
import { normalizePlayerFields } from "@/lib/tournament/player-fields";
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
  type EventStatus,
  type PlayerInput,
  type PodResult,
  type TournamentState,
} from "@/lib/tournament/types";

export function useTournament() {
  const [state, setState] = useState<TournamentState>(emptyTournament);
  const [hydrated, setHydrated] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [selfPlayerId, setSelfPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setState(loadTournament());
    setIsOrganizer(loadOrgSession());
    setSelfPlayerId(loadSelfPlayerId());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveTournament(state);
  }, [state, hydrated]);

  const standings = useMemo(() => computeStandings(state), [state]);
  const eventStatus = state.eventStatus;
  const inscriptionsOpen = eventStatus === "inscricoes_abertas";
  const isLocked = eventStatus === "lock";
  const isClosed = eventStatus === "encerrado";

  const canManageEvent = isOrganizer;
  const canPair = isOrganizer && isLocked;
  const canReport = isOrganizer && isLocked;
  const canAddPlayer =
    isOrganizer || (inscriptionsOpen && !selfPlayerId);
  const canEditPlayer = useCallback(
    (playerId: string) => {
      if (isOrganizer) return true;
      if (!inscriptionsOpen) return false;
      return selfPlayerId === playerId;
    },
    [inscriptionsOpen, isOrganizer, selfPlayerId],
  );
  const canRemovePlayer = useCallback(
    (playerId: string) => {
      if (isOrganizer) {
        return state.rounds.length === 0 && inscriptionsOpen;
      }
      return (
        inscriptionsOpen &&
        selfPlayerId === playerId &&
        state.rounds.length === 0
      );
    },
    [inscriptionsOpen, isOrganizer, selfPlayerId, state.rounds.length],
  );

  const update = useCallback((fn: (prev: TournamentState) => TournamentState) => {
    setError(null);
    setState((prev) => fn(prev));
  }, []);

  const enterOrganizer = useCallback((pin: string) => {
    if (!verifyOrgPin(pin)) {
      setError("PIN de organizador incorreto.");
      return false;
    }
    saveOrgSession(true);
    setIsOrganizer(true);
    setError(null);
    return true;
  }, []);

  const leaveOrganizer = useCallback(() => {
    saveOrgSession(false);
    setIsOrganizer(false);
  }, []);

  const setEventStatus = useCallback(
    (status: EventStatus) => {
      if (!isOrganizer) {
        setError("Só a organizadora pode mudar o estado do evento.");
        return false;
      }
      if (status === "inscricoes_abertas" && state.rounds.length > 0) {
        setError(
          "Há rodadas registradas. Remova as rodadas antes de reabrir as inscrições, ou zere o torneio.",
        );
        return false;
      }
      update((prev) => ({ ...prev, eventStatus: status }));
      return true;
    },
    [isOrganizer, state.rounds.length, update],
  );

  const claimSelf = useCallback((id: string) => {
    saveSelfPlayerId(id);
    setSelfPlayerId(id);
  }, []);

  const addPlayer = useCallback(
    (input: PlayerInput) => {
      if (!canAddPlayer) {
        setError(
          isOrganizer
            ? "Não é possível adicionar jogadores neste estado."
            : selfPlayerId
              ? "Este aparelho já tem uma ficha. Edite a sua ou peça à organizadora."
              : "Inscrições fechadas.",
        );
        return false;
      }
      const normalized = normalizePlayerFields(input);
      if (!normalized.ok) {
        setError(normalized.error);
        return false;
      }
      if (
        state.players.some(
          (p) =>
            p.name.toLocaleLowerCase("pt-BR") ===
            normalized.fields.name.toLocaleLowerCase("pt-BR"),
        )
      ) {
        setError("Já existe um jogador com esse nome.");
        return false;
      }
      const id = newId();
      update((prev) => ({
        ...prev,
        players: [...prev.players, { id, ...normalized.fields }],
      }));
      if (!isOrganizer) claimSelf(id);
      return true;
    },
    [
      canAddPlayer,
      claimSelf,
      isOrganizer,
      selfPlayerId,
      state.players,
      update,
    ],
  );

  const updatePlayer = useCallback(
    (id: string, input: PlayerInput) => {
      if (!canEditPlayer(id)) {
        setError(
          eventStatus === "inscricoes_abertas"
            ? "Só dá para editar a própria ficha neste aparelho."
            : "Inscrições trancadas — só a organizadora altera fichas.",
        );
        return false;
      }
      const normalized = normalizePlayerFields(input);
      if (!normalized.ok) {
        setError(normalized.error);
        return false;
      }
      if (
        state.players.some(
          (p) =>
            p.id !== id &&
            p.name.toLocaleLowerCase("pt-BR") ===
              normalized.fields.name.toLocaleLowerCase("pt-BR"),
        )
      ) {
        setError("Já existe um jogador com esse nome.");
        return false;
      }
      update((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === id ? { id, ...normalized.fields } : p,
        ),
      }));
      return true;
    },
    [canEditPlayer, eventStatus, state.players, update],
  );

  const removePlayer = useCallback(
    (id: string) => {
      if (!canRemovePlayer(id)) {
        setError(
          "Não dá para remover este jogador agora (lock, rodadas ou não é a sua ficha).",
        );
        return false;
      }
      update((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
      }));
      if (selfPlayerId === id) {
        saveSelfPlayerId(null);
        setSelfPlayerId(null);
      }
      return true;
    },
    [canRemovePlayer, selfPlayerId, update],
  );

  const generateRound = useCallback(() => {
    setWarning(null);
    if (!canPair) {
      setError(
        isOrganizer
          ? "Gere mesas só com o evento em lock (torneio rolando)."
          : "Só a organizadora gera rodadas (modo organizador + lock).",
      );
      return;
    }
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
  }, [canPair, isOrganizer, state, update]);

  const setPodResult = useCallback(
    (roundId: string, podId: string, result: PodResult | null) => {
      if (!canReport) {
        setError(
          isOrganizer
            ? "Resultados só com o evento em lock."
            : "Só a organizadora reporta resultados.",
        );
        return;
      }
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
    [canReport, isOrganizer, update],
  );

  const deleteLastRound = useCallback(() => {
    if (!isOrganizer || isClosed) {
      setError("Só a organizadora remove rodadas (e o evento não pode estar encerrado).");
      return;
    }
    update((prev) => ({
      ...prev,
      rounds: prev.rounds.slice(0, -1),
    }));
    setWarning(null);
  }, [isClosed, isOrganizer, update]);

  const resetAll = useCallback(() => {
    if (!isOrganizer) {
      setError("Só a organizadora pode zerar o torneio.");
      return;
    }
    clearTournament();
    saveSelfPlayerId(null);
    setSelfPlayerId(null);
    setState(emptyTournament());
    setError(null);
    setWarning(null);
  }, [isOrganizer]);

  return {
    state,
    hydrated,
    error,
    warning,
    standings,
    eventStatus,
    isOrganizer,
    selfPlayerId,
    inscriptionsOpen,
    isLocked,
    isClosed,
    canManageEvent,
    canPair,
    canReport,
    canAddPlayer,
    canEditPlayer,
    canRemovePlayer,
    enterOrganizer,
    leaveOrganizer,
    setEventStatus,
    claimSelf,
    addPlayer,
    updatePlayer,
    removePlayer,
    generateRound,
    setPodResult,
    deleteLastRound,
    resetAll,
    clearError: () => setError(null),
  };
}
