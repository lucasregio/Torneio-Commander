"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EVENT_STATUS_LABEL,
  type EventStatus,
} from "@/lib/tournament/types";

type Props = {
  eventStatus: EventStatus;
  isOrganizer: boolean;
  onEnter: (pin: string) => Promise<boolean>;
  onLeave: () => void | Promise<void>;
  onSetStatus: (status: EventStatus) => Promise<boolean>;
};

export function OrgBar({
  eventStatus,
  isOrganizer,
  onEnter,
  onLeave,
  onSetStatus,
}: Props) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3 rounded-lg border bg-card/50 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Estado do evento</span>
        <Badge variant={eventStatus === "lock" ? "default" : "secondary"}>
          {EVENT_STATUS_LABEL[eventStatus]}
        </Badge>
        {isOrganizer ? (
          <Badge variant="outline">modo organizador</Badge>
        ) : null}
        <Badge variant="outline">site compartilhado</Badge>
      </div>

      {!isOrganizer ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Todos os celulares veem o mesmo torneio (SQLite no servidor). Com
            inscrições abertas, crie sua ficha; com lock, só leitura.
            Organizadora usa PIN.
          </p>
          {showPin ? (
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setBusy(true);
                void onEnter(pin).then((ok) => {
                  setBusy(false);
                  if (ok) {
                    setPin("");
                    setShowPin(false);
                  }
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="org-pin">PIN da organizadora</Label>
                <Input
                  id="org-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN"
                  className="sm:w-40"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={busy}>
                  Entrar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPin(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowPin(true)}
            >
              Modo organizador
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Modo organizador nesta sessão. Trave as inscrições antes de gerar
            mesas — o grupo vê as mudanças em todos os aparelhos.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={
                eventStatus === "inscricoes_abertas" ? "default" : "outline"
              }
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void onSetStatus("inscricoes_abertas").finally(() =>
                  setBusy(false),
                );
              }}
            >
              Abrir inscrições
            </Button>
            <Button
              type="button"
              size="sm"
              variant={eventStatus === "lock" ? "default" : "outline"}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void onSetStatus("lock").finally(() => setBusy(false));
              }}
            >
              Trancar (lock)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={eventStatus === "encerrado" ? "default" : "outline"}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void onSetStatus("encerrado").finally(() => setBusy(false));
              }}
            >
              Encerrar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void onLeave()}
            >
              Sair do modo org
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
