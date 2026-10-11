"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Player, PlayerInput } from "@/lib/tournament/types";
import { DeckLink } from "./deck-link";

type Props = {
  players: Player[];
  roundsStarted: boolean;
  onAdd: (input: PlayerInput) => boolean;
  onUpdate: (id: string, input: PlayerInput) => boolean;
  onRemove: (id: string) => boolean;
};

const emptyForm = { name: "", commander: "", deckUrl: "" };

export function PlayersPanel({
  players,
  roundsStarted,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (onAdd(form)) setForm(emptyForm);
  }

  function startEdit(p: Player) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      commander: p.commander ?? "",
      deckUrl: p.deckUrl ?? "",
    });
  }

  function saveEdit() {
    if (editingId && onUpdate(editingId, editForm)) {
      setEditingId(null);
      setEditForm(emptyForm);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Jogadores</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre o grupo (até ~13). Comandante e link do deck são opcionais.
        </p>
      </div>

      <form onSubmit={submitAdd} className="space-y-3 rounded-lg border p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="player-name">Nome</Label>
            <Input
              id="player-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Ana"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="player-commander">Comandante (opcional)</Label>
            <Input
              id="player-commander"
              value={form.commander}
              onChange={(e) =>
                setForm((f) => ({ ...f, commander: e.target.value }))
              }
              placeholder="Ex.: Krenko, Mob Boss"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="player-deck">Link do deck (opcional)</Label>
            <Input
              id="player-deck"
              type="url"
              value={form.deckUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, deckUrl: e.target.value }))
              }
              placeholder="https://moxfield.com/..."
              autoComplete="off"
            />
          </div>
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
            <li key={p.id} className="px-3 py-2.5 text-sm">
              {editingId === p.id ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    aria-label="Nome"
                    autoFocus
                  />
                  <Input
                    value={editForm.commander}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, commander: e.target.value }))
                    }
                    placeholder="Comandante"
                    aria-label="Comandante"
                  />
                  <Input
                    type="url"
                    value={editForm.deckUrl}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, deckUrl: e.target.value }))
                    }
                    placeholder="Link do deck"
                    aria-label="Link do deck"
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
                <div className="flex items-start gap-2">
                  <span className="w-6 shrink-0 pt-0.5 text-muted-foreground">
                    {i + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{p.name}</div>
                    {(p.commander || p.deckUrl) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {p.commander && <span>{p.commander}</span>}
                        {p.commander && p.deckUrl && <span aria-hidden>·</span>}
                        {p.deckUrl && <DeckLink href={p.deckUrl} />}
                      </div>
                    )}
                  </div>
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
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {roundsStarted && (
        <p className="text-xs text-muted-foreground">
          Rodadas já começaram: dá para editar nomes e decks, mas não remover.
          Para recomeçar do zero, use “Zerar torneio”.
        </p>
      )}
    </div>
  );
}
