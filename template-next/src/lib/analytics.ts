/**
 * dataLayer push helper.
 * Mantiene la taxonomía de eventos del landing legacy 1:1.
 *
 * Eventos canónicos:
 *   cta_click       (cta_id, cta_text, cta_lang)
 *   form_view       (form_id, lang)
 *   form_submit_attempt   (form_id, motivo, lang)
 *   form_submit_invalid   (form_id)
 *   form_submit_success   (form_id, motivo, lang)
 *   form_submit_error     (form_id, error)
 *   lang_change     (from, to)
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

type AnalyticsEvent =
  | { event: 'cta_click'; cta_id: string; cta_text: string; cta_lang: string }
  | { event: 'form_view'; form_id: string; lang: string }
  | { event: 'form_submit_attempt'; form_id: string; motivo: string; lang: string }
  | { event: 'form_submit_invalid'; form_id: string }
  | { event: 'form_submit_success'; form_id: string; motivo: string; lang: string }
  | { event: 'form_submit_error'; form_id: string; error: string }
  | { event: 'lang_change'; from: string; to: string }

export function pushDataLayer(payload: AnalyticsEvent): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(payload)
}
