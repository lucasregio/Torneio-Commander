"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearPlayerSession,
  createPlayer,
  createRound,
  deleteLastRound,
  fetchEvent,
  loadCachedSelfId,
  orgLogin,
  orgLogout,
  patchPlayer,
  patchStatus,
  putPodResult,
  removePlayer,
  resetEvent,
  savePlayerSession,
} from "@/lib/client-api";
import {
  emptyTournament,
  type EventStatus,
  type PlayerInput,
  type PodResult,
  type StandingRow,
  type TournamentState,
} from "@/lib/tournament/types";

export function useTournament() {
  const [state, setState] = useState<TournamentState>(emptyTournament);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [selfPlayerId, setSelfPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apply = useCallback(
    (payload: {
      state: TournamentState;
      standings: StandingRow[];
      isOrganizer?: boolean;
      selfPlayerId?: string | null;
      warning?: string | null;
    }) => {
      setState(payload.state);
      setStandings(payload.standings);
      if (payload.isOrganizer !== undefined) setIsOrganizer(payload.isOrganizer);
      if (payload.selfPlayerId !== undefined) {
        setSelfPlayerId(payload.selfPlayerId);
      }
      if (payload.warning !== undefined) setWarning(payload.warning);
    },
    [],
  );

  const refresh = useCallback(async () => {
    const data = await fetchEvent();
    apply({
      state: data.state,
      standings: data.standings,
      isOrganizer: data.isOrganizer,
      selfPlayerId: data.selfPlayerId ?? loadCachedSelfId(),
    });
    return data;
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao carregar.");
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    const id = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [refresh]);

  const eventStatus = state.eventStatus;
  const inscriptionsOpen = eventStatus === "inscricoes_abertas";
  const isLocked = eventStatus === "lock";
  const isClosed = eventStatus === "encerrado";

  const canAddPlayer = isOrganizer || (inscriptionsOpen && !selfPlayerId);
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
      if (state.rounds.length > 0) return false;
      if (!inscriptionsOpen && !isOrganizer) return false;
      if (isOrganizer) return true;
      return selfPlayerId === playerId;
    },
    [inscriptionsOpen, isOrganizer, selfPlayerId, state.rounds.length],
  );

  const enterOrganizer = useCallback(
    async (pin: string) => {
      setError(null);
      setLoading(true);
      try {
        await orgLogin(pin);
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "PIN incorreto.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const leaveOrganizer = useCallback(async () => {
    setError(null);
    try {
      await orgLogout();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao sair.");
    }
  }, [refresh]);

  const setEventStatus = useCallback(
    async (status: EventStatus) => {
      setError(null);
      setLoading(true);
      try {
        const data = await patchStatus(status);
        apply({ state: data.state, standings: data.standings });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao mudar status.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apply],
  );

  const addPlayer = useCallback(
    async (input: PlayerInput) => {
      setError(null);
      setLoading(true);
      try {
        const data = await createPlayer(input);
        if (data.playerToken && data.playerId) {
          savePlayerSession(data.playerId, data.playerToken);
          setSelfPlayerId(data.playerId);
        }
        apply({
          state: data.state,
          standings: data.standings,
          selfPlayerId: data.playerId ?? null,
        });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao inscrever.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apply],
  );

  const updatePlayer = useCallback(
    async (id: string, input: PlayerInput) => {
      setError(null);
      setLoading(true);
      try {
        const data = await patchPlayer(id, input);
        apply({ state: data.state, standings: data.standings });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao editar.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apply],
  );

  const removePlayerFn = useCallback(
    async (id: string) => {
      setError(null);
      setLoading(true);
      try {
        const data = await removePlayer(id);
        if (selfPlayerId === id) {
          clearPlayerSession();
          setSelfPlayerId(null);
        }
        apply({
          state: data.state,
          standings: data.standings,
          selfPlayerId: selfPlayerId === id ? null : selfPlayerId,
        });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao remover.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apply, selfPlayerId],
  );

  const generateRound = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await createRound();
      apply({
        state: data.state,
        standings: data.standings,
        warning: data.warning ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar rodada.");
    } finally {
      setLoading(false);
    }
  }, [apply]);

  const setPodResult = useCallback(
    async (_roundId: string, podId: string, result: PodResult | null) => {
      setError(null);
      setLoading(true);
      try {
        const data = await putPodResult(podId, result);
        apply({ state: data.state, standings: data.standings });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao salvar resultado.");
      } finally {
        setLoading(false);
      }
    },
    [apply],
  );

  const deleteLastRoundFn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await deleteLastRound();
      apply({ state: data.state, standings: data.standings, warning: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover rodada.");
    } finally {
      setLoading(false);
    }
  }, [apply]);

  const resetAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await resetEvent();
      clearPlayerSession();
      setSelfPlayerId(null);
      apply({
        state: data.state,
        standings: data.standings,
        selfPlayerId: null,
        warning: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao zerar.");
    } finally {
      setLoading(false);
    }
  }, [apply]);

  return {
    state,
    hydrated,
    loading,
    error,
    warning,
    standings,
    eventStatus,
    isOrganizer,
    selfPlayerId,
    inscriptionsOpen,
    isLocked,
    isClosed,
    canManageEvent: isOrganizer,
    canPair: isOrganizer && isLocked,
    canReport: isOrganizer && isLocked,
    canAddPlayer,
    canEditPlayer,
    canRemovePlayer,
    enterOrganizer,
    leaveOrganizer,
    setEventStatus,
    addPlayer,
    updatePlayer,
    removePlayer: removePlayerFn,
    generateRound,
    setPodResult,
    deleteLastRound: deleteLastRoundFn,
    resetAll,
    refresh,
    clearError: () => setError(null),
  };
}
