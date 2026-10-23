"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StandingRow } from "@/lib/tournament/types";
import { DeckLink } from "./deck-link";

type Props = {
  standings: StandingRow[];
  playerCount: number;
};

export function StandingsPanel({ standings, playerCount }: Props) {
  if (playerCount === 0) {
    return (
      <div className="space-y-4">
        <Header />
        <Alert>
          <AlertDescription>
            A classificação aparece aqui assim que você cadastrar jogadores.
            Pontos: vitória 3 · empate 1 · derrota 0 · bye 3.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead>Comandante</TableHead>
              <TableHead className="text-right">Pts</TableHead>
              <TableHead className="text-right">V</TableHead>
              <TableHead className="text-right">E</TableHead>
              <TableHead className="text-right">D</TableHead>
              <TableHead className="text-right">Bye</TableHead>
              <TableHead className="text-right">
                <span title="Pontos dos oponentes">PO</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row, idx) => (
              <TableRow key={row.playerId}>
                <TableCell className="font-medium text-muted-foreground">
                  {idx + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium">{row.name}</span>
                    {idx === 0 && row.points > 0 && (
                      <Badge variant="secondary">líder</Badge>
                    )}
                    {row.deckUrl && (
                      <DeckLink href={row.deckUrl} className="inline-flex items-center gap-1 text-xs text-[var(--felt-accent)] underline-offset-2 hover:underline" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[10rem] truncate text-muted-foreground">
                  {row.commander ?? "—"}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {row.points}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.wins}</TableCell>
                <TableCell className="text-right tabular-nums">{row.draws}</TableCell>
                <TableCell className="text-right tabular-nums">{row.losses}</TableCell>
                <TableCell className="text-right tabular-nums">{row.byes}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.opponentPoints}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Desempate: pontos → PO (soma dos pontos dos oponentes) → menos byes →
        vitórias → nome. Sem top cut — ranking = suíço.
      </p>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Classificação</h2>
      <p className="text-sm text-muted-foreground">
        Standings do suíço Bo1 · pods de 4 (3 se precisar).
      </p>
    </div>
  );
}
