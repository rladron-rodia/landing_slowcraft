# template-landing-site (Producto #001 — Next.js)

> Template del Producto #001 (Landing_Site) de la Plataforma Slowcraft.
> Stack: Next.js 15 · React 19 · TypeScript estricto · Tailwind v4 · next-intl · Zod.

**Estado:** Fase B en construcción. Ver `../PROPUESTA_FASES.md`.

---

## Setup

```bash
pnpm install
cp .env.example .env.local
# editar .env.local — mínimo NEXT_PUBLIC_CONTACT_ENDPOINT y NEXT_PUBLIC_SITE_URL

pnpm dev
# → http://localhost:3000
```

## Build estático

```bash
pnpm build
# → out/ (listo para Cloudflare Pages, GitHub Pages, S3, etc.)
```

## Estructura

```
template-next/
├── public/fonts/                 # 8 .woff2 self-hosted (copiados de /fonts/ raíz)
├── messages/                     # i18n (es.json canónico, en.json mirror)
└── src/
    ├── app/                      # App Router
    │   ├── layout.tsx            # metadata API + fonts + plugins
    │   ├── page.tsx              # landing principal
    │   └── not-found.tsx
    ├── brand.config.ts           # identidad de la instance
    ├── product.config.ts         # archetype + version + compat matrix
    ├── i18n/                     # config next-intl
    ├── plugins/                  # GA4, GTM, Meta Pixel, Search Console, Hotjar
    ├── lib/                      # env, schemas, utils, analytics
    ├── components/
    │   ├── ui/                   # shadcn/ui primitives
    │   └── sections/             # hero, tesis, metodo, strategy, programs, ...
    ├── actions/                  # server actions (submit-contact)
    └── styles/
        └── globals.css           # DS v2.0 tokens en :root + Tailwind v4 import
```

## Convenciones

- TS estricto. Sin `any` salvo justificación.
- Server Components por default. Client Components solo si necesitan interactividad.
- Imports con alias `@/...`.
- Iconos: lucide-react (tree-shakeable).
- Form validation: Zod.
- Colors: usar CSS variables del DS v2.0 vía Tailwind utilities (`bg-crema`, `text-tinta`, etc.).

## Tests + checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
```

CI corre los tres + `pnpm build` en cada PR.

---

*template-next/README.md · v0.1*
