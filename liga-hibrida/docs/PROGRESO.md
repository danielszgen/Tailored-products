# PROGRESO — bitácora por etapa

## Etapa III · Liga — "Medallas, tests y evolución"

**Fecha:** 8 de septiembre de 2026.
**Estado:** completada y verificada. No se ha empezado la Etapa IV (pendiente de confirmación de Daniel).

### Qué se hizo

**Motor (`src/domain`, TypeScript puro, SPEC §7 y §10.2)**

- **R10 · Liga** (`rules/league.ts`): registros por semana del bloque (solo semanas terminadas), veredicto de cada semana Lower (aductor después ≤ 3, sin dolor creciente) y de muñeca, progreso de las 4 medallas con `earnedOn`, detalle e `isNew` (CANTERA: 4 semanas seguidas; YUNQUE: fuerza relativa de dominada y fondo con el peso subiendo; RESORTE: +15 % carga×reps en split squat; VÉRTIGO: 8 semanas limpias de muñeca + un marcador de handstand mejorado), progreso de los 10 SMART (automático o marcado a mano), nivel de entrenador por anclas de las últimas 4 semanas, estadísticas MASA / FUERZA / MOTOR / CONTROL / AVENTURA 0–100, las 4 condiciones de evolución Forma I → II, semana de test sugerida, comparación de Combates de Liga (deltas por área) e informe Markdown del bloque (`blockReport`).
- **Mejores marcas** (`rules/marks.ts`): puntuación carga×reps a RIR ≤ 2, fuerza relativa (carga+PC)×reps/PC, mejor marca por ejercicio e historial. `hasRisingRun` (R8) se reutiliza para "dolor creciente".
- **"Pregunta al Rival"** (`domain/rival`): `buildRivalContext` construye el JSON exacto de §10.2 (ficha sin email, últimos 7 check-ins, últimas 6 sesiones resumidas, rutas y Zona Salvaje de 14 días, semana actual, avisos activos y la pregunta) validado con un esquema zod **estricto** (cualquier clave extra se rechaza); system prompt fijo con la Constitución, el contexto de Daniel y R1–R11 en prosa; límites: 30 llamadas/día, 120 palabras, 600 caracteres por pregunta.
- Tipos y esquema: `LeagueTest.weekOfBlock` admite la semana 0 (baseline) y notas; `Profile.smartManual`, `evolutions` y `rivalConsentAt`. Todo opcional y exportable; Dexie sigue en v1.

**Fixture de 8 semanas** (`tests/fixtures/ochoSemanas.ts` → `ocho_semanas.json`, SPEC Apéndice B): 8 semanas del Bloque 1 (7 sep – 1 nov) con check-ins diarios, 4 combates por semana con doble progresión, rutas Z2 y largas, Zona Salvaje, descarga en la semana 4 y Combates de Liga en las semanas 0, 4 y 8. Se importa desde el onboarding (o REGEN) para ver la app "ya jugada".

**Pantallas (SPEC §8)**

- **LIGA**: tablero con marcadores de tests y medallas; medallas con progreso, detalle, fecha y animación "¡Nueva medalla!" (una vez por dispositivo); SMART con progreso automático y marcado manual; estadísticas 0–100 (también en la ficha de HOY); nivel de entrenador; Formas con las 4 condiciones y confirmación de "Evolucionar a Forma II" (queda como ajuste); Combates de Liga con deltas frente al test anterior; Índice de Movimientos con mejor marca, historial y filtros; acceso al informe del bloque.
- **Combate de Liga** (`/liga/combate`): asistente de 6 áreas (peso, fuerza, aeróbico, movilidad, handstand, transferencia) para las semanas 0/4/8/12 (la semana se sugiere por la del bloque), guarda `t_<semana>` y muestra la comparación con el test anterior.
- **Informe del bloque** (`/liga/informe`): Markdown "Semana N/12" con ficha, medallas, SMART, combates, peso, fuerza, semanas, síntomas, evolución y ajustes; copiar, compartir (Web Share) o exportar `.md`.
- **Pregunta al Rival** (`/regen/rival`, desde REGEN y desde el informe del Consejo): sin consentimiento explica qué se enviaría y lleva a Ajustes; con consentimiento y token, la primera pregunta abre la vista previa con el JSON exacto y solo sale con "Enviar este contexto"; "Ver qué se envía" en cualquier momento; contador N/30 de hoy; respuesta con el modelo y botón de copiar; historial de las últimas 10 conversaciones (guardadas como `Adjustment{source:'rival'}`).
- **Ajustes**: notificaciones locales (permiso desde el interruptor, estado, qué recuerda, nota de límites en iOS, si está instalada) y El Rival (interruptor "Enviar contexto a El Rival" con fecha de consentimiento, token de la app, endpoint).
- **GYM**: el resumen del combate muestra el avance de la medalla del gimnasio; fin del descanso con notificación y vibración; recordatorio "¿Aductor 30–60 min después?" a los 45' de Cantera/Resorte. **HOY**: recordatorio del check-in al inicio de la ventana AM si aún no está hecho.
- Las pantallas secundarias (LIGA, Combate, Informe, Consejo, Ajustes, Rival) se cargan bajo demanda (`React.lazy`).

**Servidor (Vercel, `api/rival.ts`)**

- Función serverless con `@anthropic-ai/sdk`. `ANTHROPIC_API_KEY` y `RIVAL_APP_TOKEN` solo existen en el servidor (`.env.example`); el token se compara en tiempo constante (cabecera `x-rival-token`); el cuerpo se valida con el esquema estricto (`{ context }`); contador diario por instancia; modelo `claude-opus-5` por defecto (`RIVAL_MODEL`), pensamiento adaptativo, esfuerzo `medium` (`RIVAL_EFFORT`) y fallback del servidor; los rechazos del modelo y los errores de la API se convierten en mensajes en español sin filtrar secretos. `vercel.json` excluye `/api/` del rewrite de la SPA y `.gitignore` ignora `.env*`.

**Calidad**

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | sin errores |
| `pnpm lint` (ESLint + Prettier) | sin errores ni avisos |
| `pnpm test` | 338 tests en 39 archivos (R10 y marcas, fixture de 8 semanas, Rival dominio/API/UI, notificaciones, LIGA, Combate, informe, Ajustes, GYM) |
| Cobertura `src/domain/rules` (`pnpm test:coverage`, umbral 95 % en vite.config) | 99,4 % sentencias · 97,6 % ramas · 98,7 % funciones · 99,4 % líneas |
| `pnpm build` | 189 KB gzip el chunk inicial (objetivo < 200 KB) + 9 chunks bajo demanda de 0,1–5,6 KB; 22 entradas en precache |
| Recorrido en Chromium (Playwright, iPhone 390×844, reloj fijado al 2 de noviembre de 2026) | 21/21 pasos: importar la fixture, HOY (semana 9, estadísticas), LIGA (CANTERA conseguida con animación, RESORTE 67 %, "Entrenador de Liga", FUERZA 19, deltas de la semana 8, evolución bloqueada 3/4, mejor marca), Combate S12 → comparación, informe → copiar, Ajustes (notificaciones, consentimiento y token), Rival (vista previa del JSON → respuesta con la función simulada), tema oscuro; sin errores de consola |

### Criterios de aceptación de la Etapa III (SPEC §9)

| Criterio | Estado | Cómo se verificó |
|---|---|---|
| Con la fixture de 8 semanas, LIGA muestra la medalla CANTERA conseguida en la semana 5, RESORTE ≈ 60 % y nivel "Entrenador de Liga" | ✅ | `tests/fixtures/ocho-semanas.test.ts` + `tests/ui/league.test.tsx` + recorrido: CANTERA `earnedOn` el lunes de la semana 5, RESORTE 67 % (ver PREGUNTAS), nivel "Entrenador de Liga" |
| Test de la semana 4 guardado y la semana 8 muestra los deltas | ✅ | `tests/rules/league.test.ts` (`compareTests`) + `league.test.tsx` (asistente semana 4 → deltas en la semana 8) + recorrido (S8 → S12) |
| Evolución ofrecida solo cuando se cumplen las 4 condiciones | ✅ | `league.test.ts` (`evolutionCheck`) + `league.test.tsx` (3/4 → botón bloqueado; 4/4 → confirmación → Forma II) |
| Informe de 12 semanas en Markdown compartible (Web Share o copiar) | ✅ | `league.test.ts` (`blockReport`) + `league.test.tsx` (copiar) + recorrido; compartir usa `navigator.share` cuando existe y, si no, copiar o exportar `.md` |
| "Pregunta al Rival" envía únicamente el contexto de §10.2 y muestra al usuario qué se envía antes de enviar | ✅ | `tests/domain/rival.test.ts` (esquema estricto, sin email/token/ids), `tests/api/rival.test.ts` (token, 400 con claves extra, límite 30, rechazos, errores sin secretos), `tests/ui/rival.test.tsx` (vista previa antes del primer envío; el cuerpo es `{ context }` idéntico a la vista previa) + recorrido con la función simulada. ⚠️ No se ha probado contra la API real desde este entorno: requiere desplegar en Vercel con las variables de entorno. |
| Notificaciones locales donde iOS lo permita | ⚠️ | Implementadas (permiso desde Ajustes, `showNotification` del service worker, temporizadores mientras la app está abierta) y probadas en jsdom (`tests/lib/notifications.test.ts`); falta la prueba física en un iPhone con la PWA instalada. |

### Cómo activar "Pregunta al Rival" en Vercel

1. Vercel → proyecto → *Settings → Environment Variables*: `ANTHROPIC_API_KEY` (tu clave), `RIVAL_APP_TOKEN` (una cadena larga aleatoria, p. ej. `openssl rand -hex 24`); opcionales `RIVAL_MODEL` y `RIVAL_EFFORT`. Redeploy.
2. En la app: REGEN → Ajustes → "Pregunta al Rival": activar **Enviar contexto a El Rival** y pegar el mismo token en **Token de la app**.
3. REGEN → **Pregunta al Rival** → escribir la pregunta → **Preguntar** → revisar el JSON → **Enviar este contexto**. Las siguientes preguntas se envían directamente; "Ver qué se envía" sigue disponible.

### Qué queda (Etapa IV en adelante, no iniciado)

- Etapa IV (SPEC §9): biblia visual generada (avatar en 4 formas, 4 líderes, 4 medallas, 6 tipos, objetos, fondos de Ruta y Zona Salvaje), animaciones de entrada al gimnasio, medalla, evolución y PV, splash e iconos definitivos; opcionales Supabase (sync), exportación a Google Drive y Expo para push reales.
- Pendientes menores: el límite diario del Rival en el servidor es por instancia (Vercel KV si se quiere blindar); los recordatorios solo viven mientras la app está abierta; el contador de llamadas y la marca de "vista previa vista" están en `localStorage`; la cintura sigue sin registrarse; Formas II → IV no tienen automatismo.

### Decisiones que necesito de Daniel

Ver `docs/PREGUNTAS.md`, sección "Preguntas surgidas durante la Etapa III". Las más importantes: si una semana sin Lower rompe la racha de CANTERA, si RESORTE se mide solo con el test o también con las sesiones, si Fatiga se excluye del nivel de entrenador, los pesos 50/50 de MOTOR / CONTROL / AVENTURA, el límite persistente y el modelo de El Rival.

---

## Etapa II · Motor — "Las reglas del gimnasio"

**Fecha:** 7 de septiembre de 2026.
**Estado:** completada y verificada. La Etapa III se inició tras la confirmación de Daniel.

### Qué se hizo

**Motor de reglas (`src/domain/rules`, TypeScript puro, una función pura por regla, SPEC §7)**

- **R2 · Doble progresión** (`progression.ts`): sugerencia por ejercicio a partir de las 2–3 últimas sesiones, el estado del día, la ola y los bloqueos ("Cuándo NO subir carga"): 8/8/8/8 a RIR 2 → +2,5 kg y objetivo 5–6; 8/8/7/6 → misma carga; descarga → 90 % de la última sesión sin descarga, series × 0,65 (mín. 2), RIR 4. La `reason` se muestra en español ("Subo 2,5 kg porque completaste 8/8/8/8 a RIR 2").
- **R3 · Descargas** (`deload.ts`): olas 1/2/3, descarga (semanas 4 y 8) y Final de Liga (12); series principales × 0,65 y accesorios × 0,5; Z2 −25/−35 %; aventura solo fácil; aplicación a una `WeekPlan`.
- **R4 · Interferencia** (`interference.ts`): tabla de compatibilidad de §6.7 (10 filas) + reglas 1, 2, 3, 5 y 6 sobre actividades abstractas (plan y registros); evaluación del día con ayer y mañana (24 h de protección del Lower); ROJO exige "Sé lo que hago".
- **R5 · Sustitución** (`substitution.ts`): matriz de §6.7 sobre la semana de la aventura → propuestas aceptables una a una (eliminar/convertir/nota/aviso), aplicación con registro en `WeekPlan.substitutions` y recálculo de Combustible; aviso del Lower del lunes tras aventura dura ≥ 90'.
- **R6 · Combustible** (`fuel.ts`): tipo de día (tabla 03), pre/post del gimnasio (textos de 05), guía intra por duración, "doble → ALTA" al hacer la doble.
- **R7 · Peso y calorías** (`weight.ts`): media 7 d, tendencia semanal, evaluación cada 14 días desde `blockStart` (semanas 1–2 solo miden) con el texto literal del algoritmo quincenal; casos "pierde peso" (añade comida / revisa carga); propuesta como `Adjustment{kind:'kcal'}`.
- **R8 · Síntomas** (`symptoms.ts`): serie de muñeca y aductor (check-ins + combates), tendencia creciente, KO ≥ 5, persistencia ≥ 4 durante 7 días (aviso nivel 1 que hay que leer), transición a sentadilla con barra (aductor después ≤ 2 en 3 semanas de Cantera).
- **R9 · Mínimo viable** (`minimum.ts`): clasificación A/B/C de la semana y orden de recorte C → B → A a 45' → OFF, activado por plantilla Fatiga/Viaje o 3+ días CARGADO/KO. "No hay deuda."
- **R11 · Consejo de la Liga** (`council.ts`): scorecard semanal con semáforo (Lower, Upper, Z2, movilidad, aventura, sueño, peso, dolor), adherencia a las anclas, semana siguiente (ola/descarga/plantilla/decisiones) e informe Markdown de §10.1.

**Pantallas (SPEC §8)**

- **GYM**: cada ejercicio muestra la sugerencia R2 (carga, objetivo de reps/segundos, series, RIR y razón), precarga el formulario de series, aplica descargas (R3) y el ajuste por estado (R1); ofrece la transición a high-bar squat cuando el aductor lo tolera y permite volver a la variante tolerada; muestra las notas del plan (p. ej. "reduce tirón/antebrazo").
- **HOY**: semáforo de interferencia en las tarjetas AM/PM (R4), Combustible completo (R6: tipo de día, pre/post, intra, notas), avisos ordenados por nivel (R1, R4, R5, R8, R9) con acuse de lectura para los avisos que no se pueden descartar, tarjeta de recorte R9 con aceptación por ítem, CTAs "Registrar ruta" y "Zona Salvaje".
- **RUTAS**: registro de ruta (tipo, minutos, RPE, desnivel, nota) con clasificación z2/medio/duro y aviso "la ruta se ha vuelto combate"; Zona Salvaje (deporte, minutos, intensidad, nota) con propuestas R5 aceptar/rechazar; comprobación R4 en ambos formularios con confirmación en ROJO; contador semanal de minutos Z2 frente al objetivo de la ola, ruta más larga, próxima ruta planificada y guía intra; lista de los últimos 14 días con borrado.
- **REGEN**: próximo ajuste calórico (R7) con texto del algoritmo y "Anotar el ajuste"; gráfica SVG de muñeca y aductor a 28 días con avisos R8 y estado de la transición a barra; registro de sesiones regen (yoga, movilidad, muñeca, aductor, sauna, frío, siesta, paseo) con contadores frente al mínimo semanal; **Consejo de la Liga** en `/regen/consejo`: scorecard, 7 pasos (contexto → anclas → motor → aventura → comida → recuperación → plan B), genera la semana siguiente y el informe Markdown (copiar, compartir, exportar .md) más recordatorio de exportar la copia JSON.
- **Ajustes**: la plantilla por defecto se aplica al generar semanas y puede aplicarse a la semana actual (con confirmación). **LIGA**: el calendario muestra sustituciones y notas.

**Datos**

- Sin cambios de esquema Dexie (v1): se usan las tablas `routes`, `wild`, `regen`, `adjustments` ya existentes. Campos opcionales nuevos: `PlannedItem.note`, `Profile.squatVariant`, `Advisory.id/sticky`. Hooks live para rutas, aventuras, regen, ajustes y semanas.
- Corrección: el control numérico redondeaba los pasos de 2,5 kg a enteros (70 → 73); ahora muestra y guarda 72,5.

**Calidad**

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | sin errores |
| `pnpm lint` (ESLint + Prettier) | sin errores ni avisos |
| `pnpm test` | 252 tests en 32 archivos (reglas: 120 en 11 archivos; UI: rutas, Consejo, HOY, REGEN, GYM) |
| Cobertura `src/domain/rules` (`pnpm test:coverage`, umbral 95 % en vite.config) | 99,0 % sentencias · 97,0 % ramas · 98,0 % funciones · 99,0 % líneas |
| `pnpm build` | 185 KB gzip de JS (objetivo < 200 KB), 13 entradas en precache |
| Recorrido en Chromium (Playwright, iPhone 390×844) | 21/21 pasos: onboarding, HOY (R6/R4), GYM (R2), RUTAS (ruta duro, MTB → propuestas → semana actualizada), LIGA, REGEN (R7, R8, regen), Consejo (7 pasos → informe), Ajustes, tema oscuro; sin errores de consola |

### Criterios de aceptación de la Etapa II (SPEC §9)

| Criterio | Estado | Cómo se verificó |
|---|---|---|
| Cobertura de tests en `src/domain/rules` ≥ 95 %; cada regla con los casos del informe (8/8/8/8 → +2,5 kg; 8/8/7/6 → misma carga; deload semana 4) | ✅ | umbral 95 % en `vite.config.ts`; `progression.test.ts`, `deload.test.ts` |
| Registrar MTB 120' dura el sábado propone eliminar Z2 viernes (si aún no pasó) y aviso sobre Lower del lunes; aceptar cambia la WeekPlan | ✅ | `substitution.test.ts` + `tests/ui/routes.test.tsx` + recorrido en navegador |
| Planificar running duro el día antes de Cantera muestra ROJO | ✅ | `interference.test.ts` + `routes.test.tsx` (guardar exige "Sé lo que hago") |
| Día con Cantera AM + natación PM muestra Combustible ALTA con pre 30–40 g prot + 80–120 g CH | ✅ | `fuel.test.ts` + `tests/ui/today.test.tsx` |
| Semana 3 con tendencia +0,05 %/sem propone "+150 a +200 kcal/día"; semana 1–2 no propone nada | ✅ | `weight.test.ts` + `tests/ui/regen.test.tsx` |
| Muñeca 3,4,5 en tres check-ins seguidos → aviso nivel 1 y KO en apoyos; Vértigo omite handstand y fondos | ✅ | `symptoms.test.ts` (con R1) + `today.test.tsx` |
| Consejo del domingo genera la semana siguiente correcta (ola, deload, plantilla) y un informe Markdown con el scorecard | ✅ | `council.test.ts` + `tests/ui/council.test.tsx` (semana 2 y descarga de la semana 4) |

### Qué queda (Etapa III en adelante, no iniciado)

- R10: progreso de SMART y medallas, nivel de entrenador, estadísticas 0–100, evolución Forma I→II; Combates de Liga (wizard semanas 4/8/12) y comparación; Índice de Movimientos con mejores marcas; informe de 12 semanas; "Pregunta al Rival" (§10.2) tras consentimiento; notificaciones locales.
- Pendientes menores: la cintura no se registra (el recorte "−150 a −200 si la cintura acelera" se muestra condicionado); los acuses de lectura de avisos, el checklist diario y la creatina siguen en `localStorage`; el informe del Consejo se guarda como `Adjustment{kind:'plan'}`; el bundle es un único chunk (185 KB gzip).
- Despliegue en Vercel (o GitHub Pages) pendiente de tu decisión.

### Decisiones que necesito de Daniel

Ver `docs/PREGUNTAS.md`, sección "Preguntas surgidas durante la Etapa II". Las más importantes: interpretación del incremento de carga (paso o 2,5 %), pares de interferencia fuera de la tabla, qué sustituye cada deporte, bandas del algoritmo calórico (estable ±0,05 %; 0,25–0,35 %), clasificación A/B/C para el recorte (Zona Salvaje como C), umbrales del scorecard.

---

## Etapa I · Fundación — "La ficha del entrenador"

**Fecha:** 7 de septiembre de 2026 (lunes, semana 1 del Bloque 1).
**Estado:** completada y verificada. La Etapa II se inició tras la confirmación de Daniel.

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

### Cómo instalar la PWA en un iPhone para probarla

1. **Publicar** (necesita HTTPS para que el service worker y el modo offline funcionen):
   - Vercel: *Add New Project* → importar `danielszgen/Tailored-products` → *Root Directory* = `liga-hibrida` → framework Vite (lo detecta con `vercel.json`) → Deploy. Cada push a la rama desplegada actualiza la app.
   - Alternativa local en la misma Wi-Fi: `cd liga-hibrida && pnpm install && pnpm build && pnpm preview --host` y abrir `http://<ip-del-mac>:4180` en Safari. Sirve para ver la UI, pero sin HTTPS iOS no registra el service worker (no hay modo offline).
2. En **Safari** del iPhone abrir la URL → botón *Compartir* → **Añadir a pantalla de inicio** → *Añadir*.
3. Abrir "Liga Híbrida" desde la pantalla de inicio (se abre a pantalla completa, sin barra de Safari), completar la **Semana 0**.
4. Probar offline: activar el modo avión y volver a abrir la app; hacer el check-in; desactivar el modo avión.
5. Exportar desde REGEN → *Exportar JSON* (o *Compartir* a Archivos/AirDrop) y guardar la copia.
