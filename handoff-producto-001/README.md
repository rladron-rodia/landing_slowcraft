# Handoff Producto #001 — paquete de onboarding

> Carpeta que viaja del proyecto Cowork **"Plataforma de Productos Slowcraft"** al proyecto Cowork del **Producto #001 (Landing_Site)**.
> Contiene todo lo que Claude en el otro Cowork necesita para entender la Plataforma y empezar a ajustar el Producto #001 sin romper lo que ya funciona.

**Snapshot:** 2026-05-10
**Versión del handoff:** 1.0

---

## Qué hay en esta carpeta

```
handoff-producto-001/
├── README.md              ← este archivo (instrucciones de uso)
├── BRIEF.md               ← documento principal autocontenido (LEER PRIMERO en el otro Cowork)
├── MENSAJE_INICIAL.md     ← prompt para pegar al arrancar el otro Cowork
└── contractual-snapshot/  ← snapshot de los archivos contractuales de la Plataforma
    ├── ARCHITECTURE.md
    ├── CONVENTIONS.md
    ├── SECURITY.md
    ├── PERFORMANCE.md
    ├── PLUGINS.md
    ├── DELIVERY.md
    └── ROADMAP.md
```

---

## Cómo usar este paquete (paso a paso)

### 1. Copia esta carpeta al otro proyecto

Lleva la carpeta `handoff-producto-001/` completa al proyecto Cowork del Producto #001. Dos formas:

**Opción A — Selecciona la carpeta como workspace folder del otro Cowork.** Más rápido, pero la carpeta queda fuera del repo del Producto #001.

**Opción B — Cópiala a la raíz del repo `landing_slowcraft`.** Queda versionada junto al código. Esta es la opción recomendada porque le da contexto persistente a futuras sesiones del otro Cowork.

```bash
# Si eliges Opción B (asumiendo que tienes el repo del Producto #001 clonado)
cp -R "/Users/rodrigoladrondeguevaraluna/Documents/Claude/Projects/Plataforma de Productos Slowcraft/handoff-producto-001" \
      ~/ruta/al/repo/landing_slowcraft/
```

### 2. Abre el proyecto Cowork del Producto #001

Asegúrate de que tenga acceso a:

- La carpeta `handoff-producto-001/` (este paquete).
- El código actual del landing (`landing_slowcraft` o donde viva).

### 3. Pega el mensaje inicial

Abre `MENSAJE_INICIAL.md`, copia el bloque entre triple backticks, y pégalo como primer mensaje en el otro Cowork.

### 4. Espera la auditoría de gap

Claude en el otro Cowork va a:

1. Leer el `BRIEF.md` completo.
2. Leer los archivos del `contractual-snapshot/`.
3. Inspeccionar el landing actual.
4. Entregar `AUDITORIA_GAP.md` siguiendo la estructura de la sección 8 del BRIEF.

**No debe hacer commits de código en esta primera fase.** Solo el archivo de auditoría.

### 5. Regresa con la auditoría

Cuando tengas la `AUDITORIA_GAP.md`, vuelve al proyecto Cowork de la Plataforma (este, donde estás ahora) con ese archivo. Aquí discutimos priorización, abrimos los primeros branches, y coordinamos qué cambios son necesarios del lado de la Plataforma.

---

## Cuándo regenerar este handoff

Este paquete es un **snapshot congelado en el tiempo**. Hay tres momentos en los que conviene regenerarlo:

1. **Cuando cambien los contratos de la Plataforma** — versiones nuevas de `ARCHITECTURE.md`, `SECURITY.md`, etc. Reemplaza el bundle completo, no parches archivos sueltos.
2. **Cuando el alcance del Producto #001 cambie** — si Rodrigo decide que el Template también debe incluir blog, formularios, o features nuevas, el `BRIEF.md` necesita reflejarlo.
3. **Cuando termines una fase grande** — al cerrar la auditoría y abrir la primera fase de migración, conviene un brief actualizado que parta del nuevo estado del landing, no del original.

Cada regeneración debería incrementar la "Versión del handoff" en el header de este README y en `BRIEF.md`.

---

## Qué NO está en este paquete (intencionalmente)

- **`SLOWCRAFT_VISION_DOCUMENT.md` completo** — es muy largo, mayormente irrelevante para el día a día del Producto #001, y contiene partes que no necesitan viajar fuera del proyecto de la Plataforma. El BRIEF.md resume lo que sí necesitas saber.
- **Código de la Plataforma** — no debe vivir en el repo del Producto #001. Cuando el Template necesite integrarse con la Plataforma, será vía el `@slowcraft/product-sdk` (cuando exista) o env vars documentadas, no vía import directo de código.
- **Credenciales, secrets, env vars de producción** — nada de esto viaja en un brief. Se gestiona vía GitHub Secrets / Railway / Cloudflare cuando llegue el momento.
- **Roadmap detallado por sprint** — el `ROADMAP.md` incluido es el de la Plataforma. El roadmap del Template lo construyen tú y Rodrigo después de la auditoría.

---

## Contacto

- **Owner:** Rodrigo Ladrón de Guevara · rladron@gmail.com
- **Proyecto Cowork origen:** "Plataforma de Productos Slowcraft" (donde se generó este handoff)
- **Proyecto Cowork destino:** el del Producto #001 (donde abres este handoff)

---

*Handoff generado el 2026-05-10 desde el proyecto Cowork de la Plataforma.*
