import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
const couponFormatWidth=(format:CanvasFormat)=>format==='banner'?590:360;
type CanvasFormat='full'|'list'|'banner';
import { fitPercent, ZOOM, zoomIn, zoomOut, type BoxSize } from './canvasZoom'

/**
 * Вписывать ли купон, решает раскладка в CSS: в стопке на телефоне купон тянется по ширине экрана,
 * а страница прокручивается — вписывать не во что. Брейкпоинт так живёт в одном месте.
 */
const FIT_MODE_PROPERTY = '--coupon-fit'

function layoutFitsCoupon(viewport: HTMLElement): boolean {
  return getComputedStyle(viewport).getPropertyValue(FIT_MODE_PROPERTY).trim() !== 'none'
}

function contentBoxSize(element: HTMLElement): BoxSize {
  const style = getComputedStyle(element)
  return {
    width: element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    height: element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
  }
}

/**
 * Масштаб, при котором купон целиком помещается в область холста. Пересчитывается при любом
 * изменении размеров окна, панелей и самого купона — смена раскладки тоже меняет размер холста.
 * `null` — вписывать не во что или нечем измерить.
 */
function useFittedPercent(
  viewportRef: RefObject<HTMLElement | null>,
  couponRef: RefObject<HTMLElement | null>,
  naturalWidth: number,
): number | null {
  const [fitted, setFitted] = useState<number | null>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const coupon = couponRef.current
    if (!viewport || !coupon || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      if (!layoutFitsCoupon(viewport)) return setFitted(null)
      const rect = coupon.getBoundingClientRect()
      // Скрытый холст (на телефоне открыт редактор) измерять не по чему.
      if (rect.width === 0) return
      // Масштаб меняет обе стороны купона одинаково, поэтому натуральная высота — по пропорции.
      const natural = { width: naturalWidth, height: (rect.height / rect.width) * naturalWidth }
      setFitted(fitPercent(contentBoxSize(viewport), natural))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(coupon)
    return () => observer.disconnect()
  }, [viewportRef, couponRef, naturalWidth])

  return fitted
}

/**
 * Масштаб холста: по умолчанию купон вписан в окно и следует за его размером, кнопки «−»/«+»
 * переводят в ручной масштаб, а «Вписать» возвращает автоматический. Ручной масштаб у каждого
 * формата свой: проценты полного купона на широком баннере вывели бы его далеко за холст.
 */
export function useCanvasZoom(format: CanvasFormat) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const couponRef = useRef<HTMLDivElement>(null)
  const fitted = useFittedPercent(viewportRef, couponRef, couponFormatWidth(format))
  const [chosen, setChosen] = useState<Partial<Record<CanvasFormat, number>>>({})
  const manual = chosen[format]
  const percent = manual ?? fitted ?? ZOOM.natural
  const choose = (value: number | undefined) => setChosen((current) => ({ ...current, [format]: value }))

  return {
    viewportRef,
    couponRef,
    percent,
    fitsWindow: manual === undefined,
    canZoomOut: zoomOut(percent) !== percent,
    canZoomIn: zoomIn(percent) !== percent,
    zoomOut: () => choose(zoomOut(percent)),
    zoomIn: () => choose(zoomIn(percent)),
    fitWindow: () => choose(undefined),
  }
}

export type CanvasZoom = ReturnType<typeof useCanvasZoom>
