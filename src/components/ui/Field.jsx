import Icon from './Icon'

/**
 * Ô nhập form — thiết kế LDeTr (label IN HOA + box bo 8).
 * Biến thể: as="input" | "select" | "textarea"; locked (khoá, vd Đời tự động).
 */
export default function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  as = 'input',
  options = [],
  locked = false,
  rows = 4,
  hint,
  children,
}) {
  const base =
    'w-full rounded-btn border px-3 py-2.5 text-[15px] text-fg outline-none transition placeholder:text-fg-inv-2'
  const state = locked
    ? 'border-hairline bg-muted text-fg-2 cursor-not-allowed'
    : 'border-hairline bg-card focus:border-accent'

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">
        {label}
        {locked && <span className="font-normal normal-case tracking-normal text-fg-inv-2">· tự động</span>}
      </span>

      {children ? (
        children
      ) : as === 'select' ? (
        <div className="relative">
          <select
            disabled={locked}
            value={value}
            onChange={onChange}
            className={`${base} ${state} appearance-none pr-9`}
          >
            {options.map((o) => {
              const val = o.value ?? o
              const lab = o.label ?? o
              return (
                <option key={val} value={val}>
                  {lab}
                </option>
              )
            })}
          </select>
          <Icon
            name="chevron"
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-fg-2"
          />
        </div>
      ) : as === 'textarea' ? (
        <textarea
          disabled={locked}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`${base} ${state} resize-y`}
        />
      ) : (
        <input
          type={type}
          disabled={locked}
          readOnly={locked}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${base} ${state}`}
        />
      )}

      {hint && <span className="mt-1 block text-xs text-fg-inv-2">{hint}</span>}
    </label>
  )
}
