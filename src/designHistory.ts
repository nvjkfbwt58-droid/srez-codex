import type { Design as CouponDesign } from './domain'

/** Отмена хранит последние правки, а не всю сессию: в памяти десятки дизайнов, не сотни. */
export const DESIGN_HISTORY_LIMIT = 40

export interface DesignHistory {
  /** Дизайны до правок, старые первыми. */
  past: readonly CouponDesign[]
  /** Отменённые правки, ближайшая первой. */
  future: readonly CouponDesign[]
  /**
   * Дизайн до первой правки — с ним сравнивает «До / после». Хранится отдельно: `past` обрезается
   * по лимиту, а этот дизайн нужен всегда.
   */
  original?: CouponDesign
}

export const EMPTY_DESIGN_HISTORY: DesignHistory = { past: [], future: [] }

/** Пауза, после которой правка того же поля считается новым смысловым шагом, а не тем же движением. */
export const EDIT_MERGE_PAUSE_MS = 700

/** Последняя правка: какое поле меняли и когда. */
export interface EditMark {
  key: string
  at: number
}

/**
 * Ползунок и палитра шлют правку на каждое движение мыши. Такое движение — один шаг отмены: пока
 * подряд идут правки того же поля без паузы, новый шаг в историю не пишется.
 */
export function continuesEdit(last: EditMark | null, key: string | undefined, at: number): boolean {
  if (key === undefined || last === null || last.key !== key) return false
  return at - last.at < EDIT_MERGE_PAUSE_MS
}

/** Новая правка: текущий дизайн уходит в прошлое, отменённые правки больше не повторить. */
export function recordEdit(history: DesignHistory, current: CouponDesign): DesignHistory {
  return {
    past: [...history.past, current].slice(-DESIGN_HISTORY_LIMIT),
    future: [],
    original: history.original ?? current,
  }
}

export interface HistoryStep {
  history: DesignHistory
  design: CouponDesign
}

export function undoEdit(history: DesignHistory, current: CouponDesign): HistoryStep | null {
  const previous = history.past.at(-1)
  if (!previous) return null
  return {
    design: previous,
    history: { ...history, past: history.past.slice(0, -1), future: [current, ...history.future] },
  }
}

export function redoEdit(history: DesignHistory, current: CouponDesign): HistoryStep | null {
  const next = history.future[0]
  if (!next) return null
  return {
    design: next,
    history: { ...history, past: [...history.past, current], future: history.future.slice(1) },
  }
}
