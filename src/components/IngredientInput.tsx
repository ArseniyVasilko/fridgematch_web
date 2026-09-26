"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { recipesUrl } from "@/lib/search-params";
import { useIngredientSuggestions } from "./useIngredientSuggestions";
import { btn, chip } from "./ui";

interface Props {
  initial?: string[];
  tryThese?: string[];
  /** Extra URL params kept when searching (e.g. pantry=1). */
  keep?: Record<string, string | undefined>;
  variant?: "hero" | "compact";
  submitLabel?: string;
}

/**
 * "What's in your fridge?" ingredient input: type to get suggestions, press
 * Enter or comma to add a chip, or tap a "Try these" chip (design doc 7.2:
 * users can tap instead of type).
 */
export function IngredientInput({
  initial = [],
  tryThese = [],
  keep = {},
  variant = "hero",
  submitLabel = "Find Recipes",
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<string[]>(initial);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [hint, setHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const suggestions = useIngredientSuggestions(text, items);

  const has = (name: string) => items.some((i) => i.toLowerCase() === name.toLowerCase());

  function add(raw: string) {
    const names = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.length) return items;
    const next = [...items];
    for (const n of names) if (!next.some((i) => i.toLowerCase() === n.toLowerCase())) next.push(n);
    setItems(next);
    setText("");
    setActive(-1);
    setHint(null);
    return next;
  }

  function remove(name: string) {
    setItems((prev) => prev.filter((i) => i !== name));
    inputRef.current?.focus();
  }

  function submit() {
    const all = text.trim() ? add(text) : items;
    if (!all.length && !keep.pantry) {
      setHint("Add at least one ingredient first.");
      inputRef.current?.focus();
      return;
    }
    router.push(recipesUrl({ ...keep, i: all }));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && suggestions[active]) add(suggestions[active]);
      else if (text.trim()) add(text);
      else submit();
    } else if (e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && items.length) {
      setItems(items.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;
  const hero = variant === "hero";

  return (
    <form
      role="search"
      aria-label="Find recipes by ingredients"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full"
    >
      <div className={`flex flex-col gap-2 ${hero ? "sm:flex-row" : "md:flex-row"}`}>
        <div className="relative flex-1">
          <div
            className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 focus-within:border-brown focus-within:ring-2 focus-within:ring-brown/30"
            onClick={() => inputRef.current?.focus()}
          >
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            {items.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-sm font-semibold text-brown-dark">
                {name}
                <button
                  type="button"
                  onClick={() => remove(name)}
                  className="rounded-full p-0.5 hover:bg-accent"
                  aria-label={`Remove ${name}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onKeyDown={onKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              placeholder={items.length ? "Add another…" : "Enter ingredients (e.g. chicken, rice, broccoli)"}
              className="min-w-[8rem] flex-1 bg-transparent py-1.5 text-ink placeholder:text-muted/80 focus:outline-none"
              aria-label="Ingredient"
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              autoComplete="off"
              enterKeyHint="done"
            />
          </div>
          {showList && (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-card py-1 shadow-lg"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s);
                  }}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${i === active ? "bg-sand" : "hover:bg-sand"}`}
                >
                  <Plus className="h-3.5 w-3.5 text-brown" aria-hidden /> {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className={`${btn.primary} min-h-12 whitespace-nowrap`}>
          {submitLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p aria-live="polite" className="mt-1 min-h-0 text-sm font-semibold text-tomato">
        {hint}
      </p>
      {tryThese.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-brown-dark">Try these:</span>
          {tryThese.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              disabled={has(t)}
              className={`${chip} disabled:opacity-50`}
              aria-label={`Add ${t}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
