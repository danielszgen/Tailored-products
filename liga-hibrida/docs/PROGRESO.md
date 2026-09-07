# PROGRESO — bitácora por etapa

## Etapa I · Fundación — "La ficha del entrenador"

**Fecha:** 7 de septiembre de 2026 (lunes, semana 1 del Bloque 1).
**Estado:** completada y verificada. No se ha empezado la Etapa II (pendiente de confirmación de Daniel).

### Qué se hizo

**Proyecto y tooling** (`liga-hibrida/`)

- Vite 6 + React 18 + TypeScript 5.9 + Tailwind 3.4 · Dexie 4 · date-fns 4 · zod 3 · vite-plugin-pwa 1.3 · Vitest 3 + Testing Library · ESLint 9 + Prettier. Scripts: `pnpm dev · build · preview · test · typecheck · lint · icons`.
- `CLAUDE.md` (SPEC §12), `docs/SPEC.md`, `docs/PREGUNTAS.md`, `vercel.json` (SPA rewrites, listo para importar en Vercel con *Root Directory* = `liga-hibrida`).
- Ubicación: el repositorio `Tailored-products` ya alojaba un proyecto Remotion y `doga-preview/`, así que Liga Híbrida vive en la subcarpeta `liga-hibrida/` con su propio `CLAUDE.md` (ver PREGUNTAS).

**PWA / iOS**

- `manifest.webmanifest` generado (standalone, portrait, iconos 192/512 + maskable), service worker con precache de la app, `navigateFallback` y caché en runtime de Google Fonts; metas iOS (`apple-mobile-web-app-capable`, `apple-touch-icon` 180 px, `viewport-fit=cover`, `theme-color` por tema); barra inferior con `safe-area-inset-bottom`; inputs ≥ 16 px (sin zoom), `inputmode="decimal"`, `100dvh`, `prefers-reduced-motion`.
- Iconos: SVG original + PNG 180/192/512 generados con Chromium headless (`scripts/icons.mjs`).

**Marca (SPEC §4)**

- `src/brand/tokens.ts` + variables CSS claro/oscuro (respeta `prefers-color-scheme`, toggle manual en Ajustes). Tipografías Titan One / Nunito / Silkscreen. Números tabulares.
- Iconografía SVG original (`src/brand/icons`): 6 glifos de tipo, 4 medallas con 3 estados, 3 estados OK/CARGADO/KO, 4 siluetas de Forma, marca de la app.
- Dos valores del tema claro se han oscurecido mínimamente para cumplir contraste AA (SPEC §11): ver PREGUNTAS.

**Dominio (SPEC §5–§7)**

- `src/domain/types.ts`: modelo de §5 íntegro; adiciones opcionales marcadas con `// +` (p. ej. `PlannedItem` de tipo `sport` y `note`, `warmupDone`, `accessory`).
- Contenido de §6 transcrito literalmente en `src/domain/content/`: los 4 gimnasios (25 ejercicios con series, reps, RIR, descansos, notas y paso de carga; calentamientos obligatorios con etiquetas; fueling; versiones 45/60/75; transición a sentadilla con barra), semana base y 5 plantillas, bloque de 12 semanas con olas y descargas, progresión del bloque y del aeróbico, Formas I–IV, Constitución (jerarquía y 8 reglas), estadísticas y 10 SMART, nutrición (algoritmo quincenal, tipos de día, timing, snacks, checklist), Mochila y chequeo matinal, tests de Liga y medallas, microdosis, tablas de Rutas (interferencia, semáforo, sustituciones).
- Regla **R1** (`src/domain/rules/pv.ts`): PV, verdes, estado OK/CARGADO/KO (umbrales ≥ 5, tendencia creciente en 3 check-ins, ≤ 1 verde, PV < 60) y efecto sobre la sesión (−1 serie accesorios y RIR +1 en CARGADO; técnica suave, omitir handstand/fondos por muñeca, sustituir Lower por movilidad + Copenhagen por aductor; mensaje de valoración profesional a los 3 registros).

**Datos (SPEC §5 Dexie)**

- Dexie v1 con 10 tablas e índices por `date`/`gymId`; repositorios tipados; hooks live (`useLiveQuery`); exportación JSON completa (`liga-hibrida-YYYY-MM-DD.json`) e importación validada con zod (reemplazar / fusionar; rechaza versiones futuras); "Borrar todo".

**Pantallas (SPEC §8, alcance Etapa I)**

- **Semana 0 (onboarding)**: 5 pasos con los defaults de §2 (`// DECISION: Dn`), baselines opcionales, contar/porciones, notas; crea `Profile`, la semana 1 (plantilla estándar) y las 4 medallas. Permite restaurar una copia JSON.
- **HOY**: ficha compacta (nombre, Forma, semana N/12 y ola, PV, estado), check-in de 4 controles + peso opcional en < 30 s, tarjetas AM/PM con la versión ajustada y el porqué cuando CARGADO/KO, Combustible (tipo de día, pre/post del gimnasio, checklist de 5 ticks), avisos ordenados por nivel de la jerarquía, CTA "Entrar a [gimnasio]", tarjeta "¿Aductor 30–60 min después?" tras un Lower.
- **GYM**: 4 gimnasios (el de hoy primero, versión sugerida por estado), combate con calentamiento obligatorio (bloquea el trabajo principal), sugerencia "misma carga que la última vez" (sin R2), registro de series con ± paso de carga, reps/segundos, RIR, L/R, temporizador de descanso automático con el rango del ejercicio (vibración si el dispositivo lo permite), cierre con el registro mínimo (energía, muñeca, aductor, sensación, deporte 24 h), resumen (volumen, series, mejor serie vs última) e historial.
- **REGEN**: peso con media móvil 7 d, tendencia semanal y banda objetivo (+0,10–0,25 %/sem) en SVG propio; registro rápido del peso de hoy; Mochila con tick diario de creatina; microdosis de muñeca y aductor (guías); chequeo matinal; exportar / compartir / importar JSON.
- **Ajustes**: tema, ventanas AM/PM, plantilla de semana por defecto, unidades, exportar, "Borrar todo" (escribiendo BORRAR).
- **LIGA**: tablero de 12 semanas (olas, descargas, tests, semana actual), calendario semanal de solo lectura con navegación 1–12, Formas I–IV, medallas (bloqueadas), estadísticas "—", 10 SMART, nivel de entrenador (umbrales), Índice de Movimientos.
- **RUTAS**: plan aeróbico de la ola actual, clasificación por RPE, 7 reglas de interferencia, semáforo de compatibilidad, matriz de sustituciones, escenarios. El registro de rutas y Zona Salvaje llega en la Etapa II.

**Calidad**

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | sin errores |
| `pnpm lint` (ESLint + Prettier) | sin errores ni avisos |
| `pnpm test` | 154 tests en 18 archivos (R1: 29 casos; contenido; datos; UI) |
| `pnpm build` | 161 KB gzip de JS (objetivo < 200 KB), 13 entradas en precache |
| Recorrido en Chromium (Playwright, iPhone 390×844) | 22/22 pasos |
| Lighthouse 13 (móvil, `/onboarding`) | Accesibilidad 98 · Buenas prácticas 96 · SEO 91 · Rendimiento 86 |

### Criterios de aceptación de la Etapa I (SPEC §9)

| Criterio | Estado | Cómo se verificó |
|---|---|---|
| `pnpm build` produce PWA instalable en iOS; abre offline; check-in offline | ✅ | manifest + service worker registrados; recarga sin conexión renderiza la app (Playwright). Falta la prueba física en un iPhone (ver "Cómo probar"). |
| Onboarding crea Profile y semana 1; HOY muestra Cantera el lunes 7 sep | ✅ | test `onboarding.test.tsx` + recorrido en navegador |
| Check-in en < 30 s con una mano; PV y estado correctos según R1 (10 casos, KO por muñeca 5, CARGADO por 2 verdes) | ✅ | `pv.test.ts` (14 casos de tabla + límites + rejilla) y `checkin.test.tsx`; 4 controles grandes + un botón |
| Combate completo de Cantera con calentamiento obligatorio, series, descansos y cierre; queda en Dexie y aparece en el historial | ✅ | `gym-session.test.tsx` + recorrido en navegador |
| Gráfica de peso con media móvil 7 d | ✅ | `weight-chart.test.tsx` + `math.test.ts` |
| Export → borrar todo → import deja el estado idéntico | ✅ | `export-import.test.ts` + recorrido (tablas idénticas tras reimportar) |
| Tema claro/oscuro sin texto ilegible | ✅ | Lighthouse contraste OK; capturas en ambos temas |
| Lighthouse PWA ≥ 90, sin errores de consola | ⚠️ | Lighthouse ≥ 12 ya no tiene categoría "PWA": se verifica la instalabilidad (manifest, SW, offline) con el recorrido automatizado; sin errores de consola salvo la carga de Google Fonts en el sandbox sin proxy. |

### Qué queda (Etapa II en adelante, no iniciado)

- R2–R9 y R11: doble progresión con razón, descargas, versiones por estado y tiempo, RUTAS y Zona Salvaje con interferencia y sustituciones, Combustible completo (R6), algoritmo calórico quincenal (R7), síntomas y transición a sentadilla con barra (R8), mínimo viable (R9), Consejo de la Liga con scorecard, semana siguiente e informe para El Rival, plantillas de semana aplicadas al planificador.
- Etapa III: R10 (medallas, SMART, evolución, nivel de entrenador, estadísticas 0–100), Combates de Liga, "Pregunta al Rival", notificaciones locales.
- Pequeños pendientes de la Etapa I: checklist diario y tick de creatina viven en `localStorage` (no se exportan); el recordatorio del aductor a los 45 min es una tarjeta en HOY (sin notificación); las fuentes se descargan en runtime (cacheadas por el SW tras la primera carga); un único chunk de JS (161 KB gzip) — code-splitting opcional.
- Despliegue en Vercel (o GitHub Pages) pendiente de tu decisión.

### Decisiones que necesito de Daniel

Ver `docs/PREGUNTAS.md`. Las más importantes para seguir: (1) despliegue Vercel vs GitHub Pages; (2) valores de `ink3`/`accent` claros ajustados por contraste AA; (3) KO por tendencia creciente con valores bajos en R1; (4) qué slots cuentan como "accesorios" para el −1 serie; (5) mapeo de las plantillas Fatiga y Viaje; (6) checklist/creatina en Dexie o en localStorage.

### Cómo instalar la PWA en un iPhone para probarla

1. **Publicar** (necesita HTTPS para que el service worker y el modo offline funcionen):
   - Vercel: *Add New Project* → importar `danielszgen/Tailored-products` → *Root Directory* = `liga-hibrida` → framework Vite (lo detecta con `vercel.json`) → Deploy. Cada push a la rama desplegada actualiza la app.
   - Alternativa local en la misma Wi-Fi: `cd liga-hibrida && pnpm install && pnpm build && pnpm preview --host` y abrir `http://<ip-del-mac>:4180` en Safari. Sirve para ver la UI, pero sin HTTPS iOS no registra el service worker (no hay modo offline).
2. En **Safari** del iPhone abrir la URL → botón *Compartir* → **Añadir a pantalla de inicio** → *Añadir*.
3. Abrir "Liga Híbrida" desde la pantalla de inicio (se abre a pantalla completa, sin barra de Safari), completar la **Semana 0**.
4. Probar offline: activar el modo avión y volver a abrir la app; hacer el check-in; desactivar el modo avión.
5. Exportar desde REGEN → *Exportar JSON* (o *Compartir* a Archivos/AirDrop) y guardar la copia.
