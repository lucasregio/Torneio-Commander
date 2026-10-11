"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Player } from "@/lib/tournament/types";

type Props = {
  players: Player[];
  roundsStarted: boolean;
  onAdd: (name: string) => boolean;
  onRename: (id: string, name: string) => boolean;
  onRemove: (id: string) => boolean;
};

export function PlayersPanel({
  players,
  roundsStarted,
  onAdd,
  onRename,
  onRemove,
}: Props) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (onAdd(name)) setName("");
  }

  function startEdit(p: Player) {
    setEditingId(p.id);
    setEditName(p.name);
  }

  function saveEdit() {
    if (editingId && onRename(editingId, editName)) {
      setEditingId(null);
      setEditName("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Jogadores</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre o grupo (até ~13). Sem taxa, sem login — só nomes.
        </p>
      </div>

      <form onSubmit={submitAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="player-name">Nome</Label>
          <Input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Ana"
            autoComplete="off"
          />
        </div>
        <Button type="submit">Adicionar</Button>
      </form>

      {players.length === 0 ? (
        <Alert>
          <AlertDescription>
            Nenhum jogador ainda. Adicione pelo menos 3 nomes para gerar a
            primeira rodada.
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="divide-y rounded-lg border">
          {players.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-2 px-3 py-2.5 text-sm"
            >
              <span className="w-6 shrink-0 text-muted-foreground">{i + 1}.</span>
              {editingId === p.id ? (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={saveEdit}>
                      Salvar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="flex-1 font-medium">{p.name}</span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Editar ${p.name}`}
                    onClick={() => startEdit(p)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remover ${p.name}`}
                    disabled={roundsStarted}
                    onClick={() => onRemove(p.id)}
                  >
                    <Trash2 />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {roundsStarted && (
        <p className="text-xs text-muted-foreground">
          Rodadas já começaram: dá para editar nomes, mas não remover. Para
          recomeçar do zero, use “Zerar torneio”.
        </p>
      )}
    </div>
  );
}
