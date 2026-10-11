"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournament } from "@/hooks/use-tournament";
import { OrgBar } from "./org-bar";
import { PlayersPanel } from "./players-panel";
import { RoundsPanel } from "./rounds-panel";
import { StandingsPanel } from "./standings-panel";

export function TournamentApp() {
  const t = useTournament();

  if (!t.hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Carregando torneio…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      <header className="space-y-1 border-b border-[var(--felt-line)] pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--felt-accent)]">
          Suíço · Bo1 · Bracket 2
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Torneio Commander 500
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Classificação do grupo — pontos e mesas no celular. Dados ficam só
          neste aparelho (localStorage).
        </p>
      </header>

      <OrgBar
        eventStatus={t.eventStatus}
        isOrganizer={t.isOrganizer}
        onEnter={t.enterOrganizer}
        onLeave={t.leaveOrganizer}
        onSetStatus={t.setEventStatus}
      />

      {t.error && (
        <Alert variant="destructive">
          <AlertTitle>Ops</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{t.error}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={t.clearError}
            >
              Fechar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="classificacao" className="gap-4">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="classificacao">Classificação</TabsTrigger>
          <TabsTrigger value="rodadas">Rodadas</TabsTrigger>
          <TabsTrigger value="jogadores">Jogadores</TabsTrigger>
        </TabsList>

        <TabsContent value="classificacao">
          <StandingsPanel
            standings={t.standings}
            playerCount={t.state.players.length}
          />
        </TabsContent>

        <TabsContent value="rodadas">
          <RoundsPanel
            players={t.state.players}
            rounds={t.state.rounds}
            warning={t.warning}
            canPair={t.canPair}
            canReport={t.canReport}
            isOrganizer={t.isOrganizer}
            onGenerate={t.generateRound}
            onSetResult={t.setPodResult}
            onDeleteLast={t.deleteLastRound}
          />
        </TabsContent>

        <TabsContent value="jogadores">
          <PlayersPanel
            players={t.state.players}
            eventStatus={t.eventStatus}
            isOrganizer={t.isOrganizer}
            selfPlayerId={t.selfPlayerId}
            canAddPlayer={t.canAddPlayer}
            canEditPlayer={t.canEditPlayer}
            canRemovePlayer={t.canRemovePlayer}
            onAdd={t.addPlayer}
            onUpdate={t.updatePlayer}
            onRemove={t.removePlayer}
            onClaimSelf={t.claimSelf}
          />
        </TabsContent>
      </Tabs>

      <footer className="mt-auto flex flex-col gap-3 border-t border-[var(--felt-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Pairing v1 + desempate por PO — detalhes no README.
        </p>
        {t.isOrganizer && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm("Zerar todo o torneio neste aparelho?")
              ) {
                t.resetAll();
              }
            }}
          >
            Zerar torneio
          </Button>
        )}
      </footer>
    </div>
  );
}
