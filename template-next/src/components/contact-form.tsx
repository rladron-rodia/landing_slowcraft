'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { contactSchema, toLegacyPayload, type ContactInput } from '@/lib/contact-schema'
import { pushDataLayer } from '@/lib/analytics'

const FORM_ID = 'contact'
const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? ''

type FieldErrors = Partial<Record<keyof ContactInput, string>>

export function ContactForm() {
  const t = useTranslations('cta.form')
  const tReasons = useTranslations('cta.form.reasons')
  const locale = useLocale()
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Disparar form_view cuando entra en viewport
  useEffect(() => {
    if (!formRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          pushDataLayer({ event: 'form_view', form_id: FORM_ID, lang: locale })
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(formRef.current)
    return () => observer.disconnect()
  }, [locale])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return

    const formData = new FormData(e.currentTarget)
    const raw = Object.fromEntries(formData.entries())

    const parsed = contactSchema.safeParse(raw)

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactInput | undefined
        if (key) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      pushDataLayer({ event: 'form_submit_invalid', form_id: FORM_ID })
      return
    }

    setErrors({})

    // Honeypot — si el campo "website" tiene valor, simulamos éxito y no
    // enviamos nada (es un bot).
    if (parsed.data.website) {
      setStatus('success')
      return
    }

    pushDataLayer({
      event: 'form_submit_attempt',
      form_id: FORM_ID,
      motivo: parsed.data.reason,
      lang: locale,
    })

    setStatus('submitting')

    try {
      if (!ENDPOINT) throw new Error('NEXT_PUBLIC_CONTACT_ENDPOINT not configured')

      const payload = toLegacyPayload(parsed.data)
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          _meta: { referrer: typeof document !== 'undefined' ? document.referrer : '' },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      setStatus('success')
      pushDataLayer({
        event: 'form_submit_success',
        form_id: FORM_ID,
        motivo: parsed.data.reason,
        lang: locale,
      })
      formRef.current?.reset()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown'
      setStatus('error')
      setErrorMessage(msg)
      pushDataLayer({ event: 'form_submit_error', form_id: FORM_ID, error: msg })
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <Field label={t('fullName')} error={errors.fullName} id={`${formId}-fullName`}>
        <input
          id={`${formId}-fullName`}
          name="fullName"
          type="text"
          required
          placeholder={t('fullNamePlaceholder')}
          className="form-input"
        />
      </Field>

      <Field label={t('email')} error={errors.email} id={`${formId}-email`}>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          required
          placeholder={t('emailPlaceholder')}
          className="form-input"
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label={t('jobTitle')} error={errors.jobTitle} id={`${formId}-jobTitle`}>
          <input
            id={`${formId}-jobTitle`}
            name="jobTitle"
            type="text"
            required
            placeholder={t('jobTitlePlaceholder')}
            className="form-input"
          />
        </Field>

        <Field
          label={t('companyWebsite')}
          error={errors.companyWebsite}
          id={`${formId}-companyWebsite`}
        >
          <input
            id={`${formId}-companyWebsite`}
            name="companyWebsite"
            type="text"
            required
            placeholder={t('companyWebsitePlaceholder')}
            className="form-input"
          />
        </Field>
      </div>

      <Field label={t('reason')} error={errors.reason} id={`${formId}-reason`}>
        <select
          id={`${formId}-reason`}
          name="reason"
          required
          defaultValue=""
          className="form-input"
        >
          <option value="" disabled>
            {t('reasonPlaceholder')}
          </option>
          <option value="proyectos">{tReasons('proyectos')}</option>
          <option value="informes">{tReasons('informes')}</option>
          <option value="bolsa-de-trabajo">{tReasons('bolsa-de-trabajo')}</option>
        </select>
      </Field>

      <Field label={t('description')} error={errors.description} id={`${formId}-description`}>
        <textarea
          id={`${formId}-description`}
          name="description"
          required
          rows={5}
          placeholder={t('descriptionPlaceholder')}
          className="form-input resize-y"
        />
      </Field>

      <button
        type="submit"
        disabled={status === 'submitting'}
        data-gtm-id="cta_form_submit"
        className="w-full bg-tinta py-4 font-mono text-xs uppercase tracking-wider text-crema transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === 'submitting' ? t('submitting') : t('submit')}
      </button>

      {status === 'success' && (
        <p
          role="status"
          className="border-l-2 border-success bg-crema-soft p-4 text-sm text-success"
        >
          {t('success')}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="border-l-2 border-danger bg-crema-soft p-4 text-sm text-danger">
          {t('error')}
          {errorMessage && (
            <span className="mt-2 block font-mono text-xs opacity-70">({errorMessage})</span>
          )}
        </p>
      )}

      <style>{`
        .form-input {
          width: 100%;
          padding: 12px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--border-default);
          font-family: var(--sans);
          font-size: 16px;
          color: var(--text-primary);
          transition: border-color var(--duration-fast) var(--ease-out);
        }
        .form-input::placeholder { color: var(--piedra-soft); }
        .form-input:hover { border-bottom-color: var(--piedra); }
        .form-input:focus { outline: none; border-bottom-color: var(--cobre); }
        .form-input:focus-visible { outline-offset: 2px; }
      `}</style>
    </form>
  )
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-mono text-xs uppercase tracking-wider text-piedra">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
