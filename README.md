# Slowcraft — Landing

Landing page de **Slowcraft**: Strategy & Programs para diseñar flujos donde el talento humano y la IA hacen lo que mejor saben hacer.

## Stack

- HTML estático single-file (sin build step)
- CSS in-line con variables custom (paleta tinta / crema / salvia / cobre / piedra)
- Tipografías: [Newsreader](https://fonts.google.com/specimen/Newsreader) (serif) + [Inter](https://fonts.google.com/specimen/Inter) (sans), cargadas desde Google Fonts

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

| Token        | Hex       | Uso                       |
|--------------|-----------|---------------------------|
| `--tinta`    | `#0F0F0E` | Texto principal           |
| `--crema`    | `#F5F1EA` | Fondo                     |
| `--crema-soft` | `#EFEAE0` | Fondo secundario        |
| `--salvia`   | `#3A4F41` | Acentos / CTA secundario  |
| `--cobre`    | `#A8593D` | Acentos cálidos / links   |
| `--piedra`   | `#7A7570` | Texto secundario          |
| `--piedra-soft` | `#B5B0A8` | Bordes / divisores     |

## Licencia

Apache License 2.0 — ver [`LICENSE`](LICENSE).
