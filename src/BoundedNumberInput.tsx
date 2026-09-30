import { useState } from 'react'
const numberWithin=(text:string,bounds:{min:number;max:number})=>{const n=Number(text);return text.trim()&&Number.isFinite(n)&&n>=bounds.min&&n<=bounds.max?n:null;};

interface BoundedNumberInputProps {
  value: number
  min: number
  max: number
  onCommit: (value: number) => void
}

/**
 * Числовое поле, которое применяет только допустимые значения. Набранный текст хранится до потери фокуса,
 * поэтому промежуточное «3» по пути к «32» не сбрасывается к прежнему размеру.
 */
export function BoundedNumberInput({ value, min, max, onCommit }: BoundedNumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={draft ?? String(value)}
      onChange={(event) => {
        setDraft(event.target.value)
        const next = numberWithin(event.target.value, { min, max })
        if (next !== null) onCommit(next)
      }}
      onBlur={() => setDraft(null)}
    />
  )
}
