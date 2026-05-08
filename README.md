# Slowcraft — Landing

Landing page de **Slowcraft**: Strategy & Programs para diseñar flujos donde el talento humano y la IA hacen lo que mejor saben hacer.

## Stack

- HTML estático single-file (sin build step)
- CSS in-line con variables custom (design system v2.0 completo en `:root`)
- Tipografías: [Newsreader](https://fonts.google.com/specimen/Newsreader) (serif) + [Inter](https://fonts.google.com/specimen/Inter) (sans) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (mono), cargadas desde Google Fonts

## Estructura

```
.
├── index.html              # Landing principal (single-file)
├── docs/
│   └── design-system.html  # Design system de referencia (tokens, tipografía, componentes)
├── README.md
├── LICENSE
└── .gitignore
```

## Design system

El archivo [`docs/design-system.html`](docs/design-system.html) es la **fuente de verdad** para colores, tipografía, espaciado y componentes. Toda nueva sección o feature debe respetar los tokens y patrones definidos ahí. Para previsualizar:

```bash
open docs/design-system.html
```

## Desarrollo local

No requiere build. Para previsualizar localmente:

```bash
# Opción 1: abrir directo en el navegador
open index.html

# Opción 2: servidor estático (recomendado, evita problemas con CORS / fuentes)
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

## Deploy

El repo está pensado para deploy estático (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Al ser un único `index.html` en la raíz, no hace falta configurar build commands.

## Branding

Paleta extendida del design system v2.0 (todos los tokens disponibles en `index.html`):

| Familia    | Tokens                                                    |
|------------|-----------------------------------------------------------|
| Tinta      | `--tinta` `#0F0F0E` · `--tinta-80` `#2A2A28`              |
| Crema      | `--crema` `#F5F1EA` · `--crema-soft` `#EFEAE0` · `--crema-deep` `#E8E3DA` |
| Salvia     | `--salvia` `#3A4F41` · `--salvia-light` `#5C705F`         |
| Cobre      | `--cobre` `#A8593D` · `--cobre-light` `#C77A57`           |
| Piedra     | `--piedra` `#7A7570` · `--piedra-soft` `#B5B0A8` · `--piedra-light` `#DDD8D0` |
| Estados    | `--success` · `--warning` · `--danger` · `--info`         |

Además: tokens semánticos (`--bg-*`, `--text-*`, `--border-*`), escala de spacing (`--space-1` a `--space-48` + semánticos), containers (`--container-sm` a `--container-2xl`) y motion (`--ease-*`, `--duration-*`). Ver [`docs/design-system.html`](docs/design-system.html) para referencia visual completa.

## Licencia

Apache License 2.0 — ver [`LICENSE`](LICENSE).
