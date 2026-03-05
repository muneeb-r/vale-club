"use client";

import { useRouter, usePathname } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SearchModal() {
  const t = useTranslations("search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill with current query when opening
  useEffect(() => {
    if (open) {
      setValue(searchParams.get("q") ?? "");
      // Focus after dialog animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, searchParams]);

  function submit(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    setOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit(value);
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t("search_placeholder")}
        >
          <Search className="w-5 h-5" />
        </button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md gap-0 p-4"
        showCloseButton={false}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("search_placeholder")}
            className="w-full h-10 rounded-full border border-border bg-background pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          {value ? (
            <button
              onClick={() => setValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => submit(value)}
            className="px-4 py-1.5 rounded-full text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {t("search_action")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
