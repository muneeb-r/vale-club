"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/lib/navigation";
import { Loader2, ChevronDown } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  in_progress: "En proceso",
  done: "Completado",
  cancelled: "Cancelado",
};

interface Props {
  orderId: string;
  currentStatus: string;
  currentNote: string;
}

export default function AdminOrderActions({ orderId, currentStatus, currentNote }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/admin/shop-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      router.refresh();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="text-xs rounded-full h-7 gap-1"
        onClick={() => setOpen((v) => !v)}
      >
        Gestionar
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="mt-3 space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Estado</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Nota interna (visible al cliente)</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-xs resize-none"
              placeholder="Añade una nota para el cliente..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="text-xs h-7 rounded-full" disabled={saving} onClick={handleSave}>
              {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
