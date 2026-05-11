# Mensaje inicial para pegar en el otro Cowork (Producto #001)

> Copia el bloque de abajo y pégalo como primer mensaje en el proyecto Cowork del Producto #001.
> Asume que en ese proyecto ya cargaste la carpeta `handoff-producto-001/` completa (BRIEF.md + contractual-snapshot/).

---

## Bloque para pegar

```
Hola. Vas a evolucionar el Producto #001 (Landing_Site) de Slowcraft.

CONTEXTO IMPORTANTE — léelo antes de hacer nada:

1) Este proyecto Cowork es DISTINTO del proyecto Cowork de la Plataforma Slowcraft.
   Tú trabajas el Template del producto landing-site. La Plataforma se construye
   en otro Cowork y yo (Rodrigo) orquesto entre ambos.

2) El landing actual (repo rladron-rodia/landing_slowcraft) está EN PRODUCCIÓN
   sirviendo slowcraft.ai. La regla de oro es: nada de lo que hagas puede romper
   el sitio público durante la transición.

3) El destino es convertir este landing en:
   - product-landing-site (el Template upstream, primer Template del catálogo)
   - client-slowcraft-landing (la instance de Slowcraft, que sigue siendo
     el sitio público)
   Triple rol del fork de Slowcraft: producción + laboratorio + showcase.

4) En la carpeta handoff-producto-001/ tienes todo el contexto que necesitas:
   - BRIEF.md → contexto autocontenido (LÉELO COMPLETO PRIMERO)
   - contractual-snapshot/ → los archivos contractuales de la Plataforma
     en versión snapshot 2026-05-10

PRIMERA TAREA — solo esto, no avances más:

Lee BRIEF.md completo. Después lee los archivos del contractual-snapshot/
en el orden que el BRIEF sugiere (sección 12).

Cuando termines, entrega una AUDITORÍA DE GAP siguiendo exactamente la
estructura de la sección 8 del BRIEF. El entregable es un solo archivo
markdown llamado AUDITORIA_GAP.md en la raíz del proyecto.

REGLAS para esta primera fase:
- No hagas commits de código todavía.
- No refactorices nada.
- No instales dependencias.
- Solo inspecciona, lee, audita y entrega el documento.
- Si encuentras decisiones que no puedes tomar sola, ponlas en la
  sección "Preguntas abiertas para Rodrigo" del entregable.

CONTEXTO ADICIONAL sobre cómo vamos a colaborar:

- Este proyecto Cowork será el hogar permanente del Producto #001.
  Aquí se irá adaptando y evolucionando el Template a lo largo del MVP
  y más allá. No es un proyecto de un día.
- Cada cambio importante pasa por: propuesta → revisión conmigo → PR
  con preview deploy → merge. Nada va directo a producción.
- Cuando termines la auditoría, yo te diré qué fase ejecutamos primero
  y abrimos un branch para esa fase.
- Para temas que dependan del lado de la Plataforma (env vars nuevas,
  SDK, contratos), no los inventes: pídemelos y yo los gestiono en el
  otro Cowork.

Empieza por leer BRIEF.md. Cuando termines de leerlo, dime "listo,
empiezo la auditoría" y arranca con el inventario del landing actual.
```

---

## Notas para Rodrigo (no pegar)

**Antes de pegar el mensaje, asegúrate de:**

1. Haber arrastrado o seleccionado la carpeta `handoff-producto-001/` completa como workspace folder del otro proyecto Cowork (o haberla copiado al repo del Producto #001).
2. Que Claude en el otro Cowork tenga permiso de lectura sobre esa carpeta.
3. Idealmente, también tener acceso de lectura al repo `rladron-rodia/landing_slowcraft` (clonarlo local o seleccionarlo como folder mountado) para que pueda inspeccionar el código actual.

**Después de pegar el mensaje, espera a que:**

- Claude confirme haber leído el BRIEF y el bundle.
- Te haga preguntas de clarificación si las tiene (es normal: la auditoría puede destapar cosas que ni tú ni yo tenemos resueltas).
- Te entregue `AUDITORIA_GAP.md`.

**Cuando llegue la auditoría, regresa al Cowork de la Plataforma con ese archivo** para discutir la priorización y abrir el primer branch de trabajo.

---

*Mensaje generado 2026-05-10 · regenerable desde el proyecto de la Plataforma*
