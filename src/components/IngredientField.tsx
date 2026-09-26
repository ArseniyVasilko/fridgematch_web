"use client";

import { useId, useState } from "react";
import { useIngredientSuggestions } from "./useIngredientSuggestions";
import { input } from "./ui";

/** Single ingredient text field with autocomplete (pantry form). */
export function IngredientField({ id, defaultValue = "", required = true }: { id: string; defaultValue?: string; required?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const suggestions = useIngredientSuggestions(open ? value : "");
  const show = open && suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0] === value);

  return (
    <div className="relative">
      <input
        id={id}
        name="name"
        value={value}
        required={required}
        maxLength={60}
        autoComplete="off"
        placeholder="e.g. spinach"
        className={input}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            setValue(suggestions[active]);
            setOpen(false);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {show && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-xl border border-line bg-card py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                setValue(s);
                setOpen(false);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-sand" : "hover:bg-sand"}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
