/**
 * Масштаб холста в процентах. Кнопки двигают его по делениям шкалы в пределах `min`–`max`;
 * вписанный в окно масштаб может оказаться мельче `min`, но не опускается ниже `fitMin`,
 * где купон уже не прочитать, и не крупнее натурального размера.
 */
export const ZOOM = { min: 60, max: 120, step: 10, natural: 100, fitMin: 30 } as const

export interface BoxSize {
  width: number
  height: number
}

/** Наибольший масштаб, при котором купон целиком виден в области холста. */
export function fitPercent(available: BoxSize, natural: BoxSize): number {
  if (natural.width <= 0 || natural.height <= 0) return ZOOM.natural
  const scale = Math.min(1, available.width / natural.width, available.height / natural.height)
  // Округление вниз: лишний процент уже даёт полосу прокрутки.
  return Math.max(ZOOM.fitMin, Math.floor(scale * 100))
}

/** Ближайшее меньшее деление шкалы; масштаб ниже шкалы кнопка «−» не увеличивает. */
export function zoomOut(zoom: number): number {
  const previousMark = Math.ceil(zoom / ZOOM.step) * ZOOM.step - ZOOM.step
  return Math.min(zoom, Math.max(ZOOM.min, previousMark))
}

/**
 * Ближайшее большее деление шкалы; масштаб выше шкалы кнопка «+» не уменьшает. Вписанный мельче
 * шкалы масштаб поднимается сразу к её началу: иначе он остался бы вне шкалы, и «−» не сработала бы.
 */
export function zoomIn(zoom: number): number {
  if (zoom < ZOOM.min) return ZOOM.min
  const nextMark = Math.floor(zoom / ZOOM.step) * ZOOM.step + ZOOM.step
  return Math.max(zoom, Math.min(ZOOM.max, nextMark))
}
