/** A checkbox or radio styled as a pill button, for the filter panel. */
export function ToggleChip({
  type,
  name,
  value,
  checked,
  count,
  children,
}: {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  checked: boolean;
  /** Recipes this option would show; options with none are dimmed. */
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <label className={`cursor-pointer ${count === 0 && !checked ? "opacity-50" : ""}`}>
      <input type={type} name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="inline-flex min-w-10 items-center justify-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-sm font-bold text-brown-dark peer-checked:border-brown peer-checked:bg-brown peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brown">
        {children}
        {count != null && <span className="text-xs font-semibold opacity-75">{count}</span>}
      </span>
    </label>
  );
}
