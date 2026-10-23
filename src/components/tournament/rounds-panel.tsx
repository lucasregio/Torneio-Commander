"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Player, Pod, PodResult, Round } from "@/lib/tournament/types";

type Props = {
  players: Player[];
  rounds: Round[];
  warning: string | null;
  canPair: boolean;
  canReport: boolean;
  isOrganizer: boolean;
  onGenerate: () => void;
  onSetResult: (roundId: string, podId: string, result: PodResult | null) => void;
  onDeleteLast: () => void;
};

export function RoundsPanel({
  players,
  rounds,
  warning,
  canPair,
  canReport,
  isOrganizer,
  onGenerate,
  onSetResult,
  onDeleteLast,
}: Props) {
  const byId = new Map(players.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Rodadas</h2>
          <p className="text-sm text-muted-foreground">
            {canReport
              ? "Gere mesas suíças e reporte vitória, empate (mesa inteira) ou bye."
              : "Mesas e resultados — leitura para o grupo; só a organizadora altera no lock."}
          </p>
        </div>
        {isOrganizer && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onGenerate}
              disabled={!canPair || players.length < 3}
            >
              Gerar rodada
            </Button>
            {rounds.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={onDeleteLast}
                disabled={!isOrganizer}
              >
                Remover última
              </Button>
            )}
          </div>
        )}
      </div>

      {warning && (
        <Alert>
          <AlertTitle>Pairing</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {!isOrganizer && (
        <Alert>
          <AlertDescription>
            Você está vendo as mesas. Pairing e reporte de resultado são da
            organizadora (modo organizador + lock).
          </AlertDescription>
        </Alert>
      )}

      {isOrganizer && !canPair && (
        <Alert>
          <AlertDescription>
            Trave as inscrições (lock) para gerar mesas e reportar resultados.
          </AlertDescription>
        </Alert>
      )}

      {players.length < 3 && (
        <Alert>
          <AlertDescription>
            Cadastre pelo menos 3 jogadores na aba Jogadores para montar mesas.
          </AlertDescription>
        </Alert>
      )}

      {rounds.length === 0 && players.length >= 3 && canPair && (
        <Alert>
          <AlertDescription>
            Nenhuma rodada ainda. Clique em “Gerar rodada” para o pairing suíço
            v1.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-8">
        {[...rounds].reverse().map((round) => (
          <section key={round.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Rodada {round.number}</h3>
              <Badge variant="outline">
                {round.pods.filter((p) => p.result).length}/{round.pods.length}{" "}
                resultados
              </Badge>
            </div>
            <div className="space-y-3">
              {round.pods.map((pod, idx) => (
                <PodCard
                  key={pod.id}
                  label={
                    pod.result?.kind === "bye" || pod.playerIds.length === 1
                      ? "Bye"
                      : `Mesa ${idx + 1}`
                  }
                  pod={pod}
                  names={byId}
                  canReport={canReport}
                  onSetResult={(result) =>
                    onSetResult(round.id, pod.id, result)
                  }
                />
              ))}
            </div>
            <Separator />
          </section>
        ))}
      </div>
    </div>
  );
}

function PodCard({
  label,
  pod,
  names,
  canReport,
  onSetResult,
}: {
  label: string;
  pod: Pod;
  names: Map<string, string>;
  canReport: boolean;
  onSetResult: (result: PodResult | null) => void;
}) {
  const isBye = pod.playerIds.length === 1 || pod.result?.kind === "bye";

  return (
    <div className="rounded-lg border bg-card/40 p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {pod.result ? (
          <Badge variant="secondary">{resultLabel(pod, names)}</Badge>
        ) : (
          <Badge variant="outline">aguardando</Badge>
        )}
      </div>

      <ul className="mb-3 space-y-1 text-sm">
        {pod.playerIds.map((id) => (
          <li key={id} className="flex items-center gap-2">
            <span
              className={
                pod.result?.kind === "win" && pod.result.winnerId === id
                  ? "font-semibold text-[var(--felt-accent)]"
                  : ""
              }
            >
              {names.get(id) ?? "?"}
            </span>
          </li>
        ))}
      </ul>

      {isBye ? (
        <p className="text-xs text-muted-foreground">
          Bye automático: +3 pontos (conta como vitória).
        </p>
      ) : canReport ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {pod.playerIds.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={
                  pod.result?.kind === "win" && pod.result.winnerId === id
                    ? "default"
                    : "outline"
                }
                onClick={() => onSetResult({ kind: "win", winnerId: id })}
              >
                Vitória: {names.get(id)?.split(" ")[0] ?? "?"}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={pod.result?.kind === "draw" ? "default" : "outline"}
              onClick={() => onSetResult({ kind: "draw" })}
            >
              Empate (mesa)
            </Button>
            {pod.result && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onSetResult(null)}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {pod.result
            ? "Resultado registrado."
            : "Aguardando resultado da organizadora."}
        </p>
      )}
    </div>
  );
}

function resultLabel(pod: Pod, names: Map<string, string>): string {
  const r = pod.result;
  if (!r) return "";
  if (r.kind === "draw") return "Empate";
  if (r.kind === "bye") return "Bye";
  return `Vitória: ${names.get(r.winnerId) ?? "?"}`;
}
