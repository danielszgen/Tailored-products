# LIGA HÍBRIDA — Informe de construcción para Claude Code

**Versión:** 1.0 · 7 septiembre 2026
**Propietario:** Daniel (dani.96.lg@gmail.com)
**Fuente de verdad del dominio:** documentos *Performance Trainee* 00, 02, 03, 04, 05 y 06 (Google Drive › Salud personal › ENTRENAMIENTO). Todo su contenido relevante está extraído en la sección 6 de este informe; no hace falta leer los .docx para construir.

---

## 0. Instrucciones para Claude Code (léelas antes de tocar nada)

1. **Lee este documento entero** antes de escribir código. Es la especificación completa: producto, marca, dominio, modelo de datos, reglas, pantallas y roadmap.
2. **Crea `CLAUDE.md` en la raíz del repo** con el contenido de la sección 12 y mantén este informe en `docs/SPEC.md`. Cada sesión de trabajo empieza leyendo ambos.
3. **Trabaja por etapas (sección 9).** No empieces la etapa N+1 sin que la etapa N cumpla sus criterios de aceptación y se haya hecho commit. Al terminar cada etapa, escribe un resumen en `docs/PROGRESO.md` con qué se hizo, qué queda y qué decisiones necesitas de Daniel.
4. **No inventes reglas de entrenamiento ni de nutrición.** Todo lo que la app decide viene de la sección 7. Si una situación no está cubierta, la app muestra "consulta al entrenador" y lo apuntas en `docs/PREGUNTAS.md`. Nunca rellenes el hueco con conocimiento general de fitness.
5. **Propiedad intelectual.** El estilo es "inspirado en juegos de entrenador de criaturas" (gimnasios, medallas, tipos, PV, evoluciones), pero **todo nombre, criatura, icono, sonido o gráfico debe ser original**. Prohibido usar nombres, personajes, logos, tipografías o assets de Pokémon o de cualquier otra franquicia.
6. **Datos del usuario = datos de salud.** Local-first, exportables, sin analítica de terceros, sin enviar nada a ningún servidor salvo lo que la sección 10 describe explícitamente y con consentimiento en la UI.
7. **Idioma de la UI: español.** Código, nombres de variables, commits y comentarios en inglés.
8. Commits pequeños y descriptivos (`feat(gym): double progression suggestion`). Antes de cada commit: `pnpm typecheck && pnpm test && pnpm lint`.
9. Si necesitas una decisión de Daniel, usa el valor por defecto de la sección 2, márcalo como `// DECISION: <id>` en el código y anótalo en `docs/PREGUNTAS.md`. No bloquees el trabajo esperando.

---

## 1. Resumen del producto

**Liga Híbrida** es una web app instalable (PWA) para iPhone que convierte el sistema de entrenamiento de Daniel en un juego de entrenador. Daniel es a la vez el entrenador y el que evoluciona. La app:

- Le dice cada día **qué toca (sesión AM/PM), en qué estado está (PV y estado OK/CARGADO/KO) y cómo comer (tipo de día nutricional)**.
- Registra lo mínimo: un check-in de 4 toques por la mañana y carga×reps×RIR de los ejercicios principales.
- Aplica solas las reglas de sus documentos: semáforo, doble progresión, descargas en las semanas 4 y 8, bloqueos de interferencia, sustituciones cuando aparece surf/MTB/escalada, algoritmo calórico quincenal, vigilancia de muñecas y aductores.
- Gamifica con moderación: 4 gimnasios con medalla, rutas, Zona Salvaje, tests cada 4 semanas ("La Liga"), evoluciones Forma I→IV, nivel de adherencia, mochila de objetos.
- Produce cada domingo un **scorecard** y un **informe exportable** que Daniel puede pegar a Claude (o enviar vía API en la etapa 3) para que actúe como entrenador.

**Usuario único.** No hay registro, login ni multiusuario en las etapas 1–3.

**Contexto del atleta (para que la UI hable con propiedad):** 1,90 m, ~3.000+ kcal/día actuales, objetivo 85–88 kg en 3 años, fuerte de torso (fondos lastrados +20 kg como referencia), piernas como punto débil con calambres de aductores post-sentadilla, fractura bilateral de muñecas antigua, sueño 8–8,5 h, creatina diaria, practica MTB, trail, escalada, natación, surf, skate, yoga y calistenia. Bloque 1 va del 7 sep al 29 nov 2026.

---

## 2. Decisiones tomadas (valores por defecto; Daniel puede cambiarlas)

| ID | Decisión | Valor por defecto |
|---|---|---|
| D1 | Nombre de la app | **Liga Híbrida** |
| D2 | Nombres de gimnasios | Cantera (Lower A), Yunque (Upper A), Resorte (Lower B), Vértigo (Upper B) |
| D3 | Avatar que evoluciona | El propio entrenador (Daniel dibujado), 4 formas. Sin criatura compañera. |
| D4 | Idioma de UI | Español; siglas de juego cortas (PV, RIR, Z2) |
| D5 | Nivel de gamificación | 2 de 3: nombres, medallas, PV, evoluciones, nivel de adherencia, mochila. Sin XP por serie, sin sonidos por defecto, sin rachas punitivas. |
| D6 | Baseline de marcas | Vacío hasta que Daniel lo introduzca en la pantalla de Semana 0. Fondos lastrados +20 kg precargado como referencia. |
| D7 | Horario | Ventana AM 07:00–09:00, ventana PM 19:00–21:00. Editable en Ajustes. |
| D8 | Privacidad | Privada. Sin compartir hasta etapa 4. |
| D9 | Imagen | Etapa 1–3 con iconografía SVG geométrica propia. Imágenes generadas (Freepik/Magnific, o fal.ai) solo en etapa 4. |
| D10 | Stack | Vite + React 18 + TypeScript + Tailwind; Dexie (IndexedDB) local-first; vite-plugin-pwa; Vitest; despliegue en Vercel. |
| D11 | Sincronización nube | No en etapas 1–3. Exportar/importar JSON. Supabase opcional en etapa 4. |
| D12 | Unidades | kg, cm, minutos. Peso con 1 decimal. |
| D13 | Inicio de semana | Lunes. Semana 1 del bloque = lunes 7 sep 2026. |

---

## 3. Stack y estructura del repositorio

```
liga-hibrida/
├─ CLAUDE.md                  # instrucciones de trabajo (sección 12)
├─ docs/
│  ├─ SPEC.md                 # este informe
│  ├─ PROGRESO.md             # bitácora por etapa
│  └─ PREGUNTAS.md            # decisiones pendientes de Daniel
├─ public/
│  ├─ manifest.webmanifest
│  ├─ icons/                  # 180, 192, 512 px (SVG→PNG, generado)
│  └─ splash/                 # iOS splash (opcional etapa 4)
├─ src/
│  ├─ app/                    # router, layout, providers
│  ├─ brand/                  # tokens.ts, tipografías, iconos SVG de tipos y medallas
│  ├─ domain/                 # TIPOS + CONTENIDO + REGLAS (sin React)
│  │  ├─ types.ts
│  │  ├─ content/             # gyms.ts, week.ts, nutrition.ts, block.ts, tests.ts, items.ts, phases.ts
│  │  └─ rules/               # pv.ts, progression.ts, deload.ts, interference.ts, substitution.ts, fuel.ts, weight.ts, symptoms.ts, minimum.ts
│  ├─ data/                   # db.ts (Dexie), repos/, export.ts, import.ts
│  ├─ features/               # today/, gym/, routes/, league/, regen/, settings/, onboarding/
│  ├─ components/             # ui compartida (Pill, Meter, Timer, Sheet, StatBar…)
│  └─ lib/                    # date utils (date-fns), id, math
├─ tests/                     # vitest: reglas del dominio 100% cubiertas
└─ package.json
```

**Principio de arquitectura:** `src/domain` es TypeScript puro, sin dependencias de React ni de la base de datos. Cada regla es una función pura `(input) => output` con test. La UI solo llama a esas funciones. Esto hace que el "entrenador" sea verificable.

**Dependencias:** react, react-dom, react-router-dom, dexie, dexie-react-hooks, date-fns, zod (validación de import/export), vite-plugin-pwa, tailwindcss, vitest, @testing-library/react, eslint, prettier. Sin librería de gráficas: las gráficas de peso y tendencia se dibujan en SVG propio (son 2–3 líneas).

**PWA / iOS:** `display: standalone`, `theme_color` según tema, `apple-mobile-web-app-capable`, `apple-touch-icon` 180 px, viewport con `viewport-fit=cover` y `safe-area-inset` en la barra inferior. Fuentes desde Google Fonts con fallback. Service worker con precache de la app y `navigateFallback`. Probar en Safari iOS: añadir a pantalla de inicio, abrir sin conexión, que el check-in funcione offline.

---

## 4. Sistema de marca

### 4.1 Nombres del universo

| Concepto del sistema | Nombre en la app |
|---|---|
| Usuario | **Entrenador** |
| Recuperación del día (0–100) | **PV** |
| Semáforo verde/ámbar/rojo | Estado **OK / CARGADO / KO** |
| Las 5 dimensiones de éxito | Estadísticas **MASA · FUERZA · MOTOR · CONTROL · AVENTURA** |
| Sesiones LOWER A / UPPER A / LOWER B / UPPER B | Gimnasios **CANTERA / YUNQUE / RESORTE / VÉRTIGO** |
| Cada sesión de gimnasio | **Combate** |
| Z2 (carrera, bici, natación suave) | **Rutas** |
| Ventana aventura del sábado | **Zona Salvaje** |
| Yoga, movilidad, sauna, sueño, paseo, microdosis | **Centro Regen** |
| Fases I–IV | **Formas I–IV** (Base, Construcción, Integración, Híbrido) |
| Bloque 12 semanas + tests cada 4 | **La Liga**; cada test = **Combate de Liga**; semana 12 = **Final de Liga** |
| Catálogo de ejercicios | **Índice de Movimientos** |
| Suplementos y herramientas de recuperación | **Mochila** (objetos) |
| Tipo de día nutricional | **Combustible** |
| Ritual del domingo | **Consejo de la Liga** |
| Claude como entrenador | **El Rival** |

### 4.2 Tokens (`src/brand/tokens.ts`)

```ts
export const colors = {
  light: { bg:'#F3F5F9', surface:'#FFFFFF', surface2:'#E9EDF4', line:'#D3DAE6',
           ink:'#141B2B', ink2:'#4A5468', ink3:'#7C879B', accent:'#E23D4A', gold:'#E9A82A' },
  dark:  { bg:'#0E1420', surface:'#161E2E', surface2:'#1E2839', line:'#2B3648',
           ink:'#EEF2F8', ink2:'#B4BDCC', ink3:'#7E8899', accent:'#FF5462', gold:'#F5B942' },
  types: { masa:'#8E5CF0', fuerza:'#E23D4A', motor:'#2F8DFF', control:'#22B573', aventura:'#E9A82A', regen:'#3BB8D6' },
  status:{ ok:'#22B573', cargado:'#E9A82A', ko:'#E23D4A' },
};
export const fonts = {
  display: '"Titan One", "Nunito", sans-serif',   // títulos, nombres de gimnasio, números grandes
  body:    '"Nunito", system-ui, sans-serif',      // texto
  pixel:   '"Silkscreen", monospace',              // etiquetas, eyebrows, PV, contadores (tamaños 9–11 px, letter-spacing 1px)
};
export const radius = { card: 14, phone: 22, pill: 6 };
```

Tema claro y oscuro obligatorios (respetar `prefers-color-scheme` y toggle manual). Tipografía tabular en números. Radios grandes solo en tarjetas de primer nivel; los elementos de lista usan 10 px.

### 4.3 Iconografía (etapas 1–3, SVG propio)

- **Tipos:** 6 glifos geométricos de 24 px (masa: círculo con barra; fuerza: hexágono; motor: flecha ondulada; control: triángulo invertido con punto; aventura: montaña; regen: gota).
- **Medallas:** 4 formas (Cantera = hexágono con montaña; Yunque = círculo con barra y discos; Resorte = cuadrado redondeado con espiral; Vértigo = triángulo con figura invertida). Estados: bloqueada (gris, contorno), en progreso (color 50 %), conseguida (color + brillo).
- **Estados:** OK (círculo lleno), CARGADO (círculo medio), KO (círculo con X).
- **Formas I–IV:** silueta de entrenador cada vez más definida (etapa 1: cuatro siluetas SVG simples; etapa 4: ilustraciones).

---

## 5. Modelo de dominio (`src/domain/types.ts`)

```ts
export type StatKey = 'masa'|'fuerza'|'motor'|'control'|'aventura';
export type GymId = 'cantera'|'yunque'|'resorte'|'vertigo';           // LOWER A, UPPER A, LOWER B, UPPER B
export type Status = 'ok'|'cargado'|'ko';
export type DayFuel = 'muy_alta'|'alta'|'media_alta'|'media'|'media_baja';
export type Form = 1|2|3|4;
export type ISODate = string;  // 'YYYY-MM-DD'

export interface Checkin {
  date: ISODate;
  sleepHours: number;         // 0–12, paso 0.5
  energy: 1|2|3|4|5;
  legs: 1|2|3|4|5;            // 1 destruidas … 5 frescas
  wrist: number;              // 0–10 dolor/molestia
  adductor: number;           // 0–10
  weightKg?: number;          // opcional, al despertar
  note?: string;
  pv: number;                 // calculado (regla R1) y guardado
  status: Status;             // calculado
}

export interface ExerciseSpec {
  id: string;                 // 'hack_squat'
  name: string;               // 'Hack squat o goblet squat con talones elevados'
  slot: string;               // 'A1', 'A2', 'B1'…
  sets: number;
  repMin: number; repMax: number;    // o secondsMin/secondsMax para isométricos
  isometric?: boolean;
  perSide?: boolean;
  rirTarget: number | [number, number];   // 2 o [3,2] = "3→2"
  restSec: [number, number];
  note: string;
  types: StatKey[];
  loadStepKg: number;         // incremento mínimo sugerido (2.5 upper / 5 lower / 1 mancuerna)
  weightedBodyweight?: boolean;  // dominada/fondo lastrado: carga = lastre
}

export interface WarmupItem { name: string; dose: string; cue: string }

export interface GymSpec {
  id: GymId; name: string; sessionCode: 'LOWER_A'|'UPPER_A'|'LOWER_B'|'UPPER_B';
  goal: string; cost: 'alto'|'medio'; primaryTypes: StatKey[];
  warmup: WarmupItem[];                       // no se puede saltar
  main: ExerciseSpec[];
  fuelPre: string; fuelPost: string;          // texto de 03/05
  versions: { min45: string[]; min60: string[]; min75: string[] };   // ids de ejercicios incluidos
}

export interface SetLog { setIndex: number; loadKg: number; reps: number; rir: number; seconds?: number; side?: 'L'|'R' }
export interface ExerciseLog { exerciseId: string; sets: SetLog[]; skipped?: boolean; substitutedBy?: string }
export interface SessionLog {
  id: string; date: ISODate; gymId: GymId; weekOfBlock: number;
  version: 45|60|75; statusAtStart: Status;
  energyStart: 1|2|3|4|5; energyEnd?: 1|2|3|4|5;
  wristDuring?: number; adductorDuring?: number; adductorAfter?: number;   // 0–10 (30–60 min después)
  feel?: 'facil'|'normal'|'pesado'; sportLast24h?: string;
  exercises: ExerciseLog[]; durationMin?: number; completed: boolean;
}

export type RouteKind = 'run'|'bike'|'swim'|'walk';
export interface RouteLog { id: string; date: ISODate; kind: RouteKind; minutes: number; rpe: number; elevationM?: number; note?: string; countsAs: 'z2'|'medio'|'duro' }

export type WildKind = 'mtb'|'trail'|'surf'|'climb_outdoor'|'boulder'|'skate'|'swim_long'|'other';
export interface WildLog { id: string; date: ISODate; kind: WildKind; minutes: number; intensity: 'facil'|'moderada'|'dura'; note?: string }

export interface RegenLog { id: string; date: ISODate; kind: 'yoga'|'movilidad'|'muneca'|'aductor'|'sauna'|'frio'|'siesta'|'paseo'; minutes: number; note?: string }

export interface WeekPlan {
  weekStart: ISODate; weekOfBlock: number; wave: 1|2|3|'deload'|'eval';
  template: 'estandar'|'montana'|'surf'|'fatiga'|'viaje';
  days: Record<0|1|2|3|4|5|6, { am?: PlannedItem; pm?: PlannedItem; fuel: DayFuel }>;
  substitutions: { date: ISODate; removed: string; reason: string }[];
}
export type PlannedItem =
  | { kind:'gym'; gymId: GymId; version: 45|60|75 }
  | { kind:'route'; routeKind: RouteKind; minutes:[number,number]; optional?: boolean }
  | { kind:'wild'; wildKind?: WildKind }
  | { kind:'regen'; what: 'yoga'|'movilidad'|'natacion_suave'|'paseo' }
  | { kind:'off' };

export interface LeagueTest {
  id: string; date: ISODate; weekOfBlock: 4|8|12;
  pullupRir2?: { loadKg: number; reps: number };
  dipRir2?: { loadKg: number; reps: number };
  splitSquat?: { loadKg: number; reps: number; side: 'L'|'R' }[];
  z2Standard?: { routeKind: RouteKind; minutes: number; rpe: number; hrAvg?: number };
  handstand?: { wallSec: number; freeSec?: number; videoNote?: string };
  mobility?: { ankleCm?: number; hipNote?: string; shoulderNote?: string; wristExtDeg?: number };
  waistCm?: number; weightAvg7?: number; transferNote?: string;
}

export interface Medal { id: 'cantera'|'yunque'|'resorte'|'vertigo'; progress: number; earnedOn?: ISODate }
export interface Profile {
  name: string; heightCm: number; startWeightKg?: number; targetWeightKg: [number,number];
  amWindow: [string,string]; pmWindow: [string,string]; blockStart: ISODate;
  form: Form; baselines: Partial<Record<string,{loadKg:number;reps:number;date:ISODate}>>;
  kcalBaseline?: number; kcalTarget?: number; dietNotes?: string;
}
export interface Adjustment { id: string; date: ISODate; kind: 'kcal'|'volumen'|'plan'|'nota'; detail: string; source: 'app'|'rival'|'daniel' }
```

**Dexie:** una tabla por interfaz (`checkins`, `sessions`, `routes`, `wild`, `regen`, `weeks`, `tests`, `medals`, `adjustments`, `profile`). Índices por `date` y `gymId`. Versionado de esquema desde v1. Export = un JSON con todas las tablas + `schemaVersion`; import valida con zod.

---

## 6. Contenido del dominio (extraído de los documentos)

### 6.1 Constitución (documento 00) — jerarquía y reglas de oro

**Jerarquía cuando los objetivos chocan** (la app etiqueta cada aviso con el nivel que protege):
1. Salud / técnica → se modifica o detiene la carga.
2. Recuperación → se reduce volumen antes que calidad técnica.
3. Objetivo de fase → recibe las mejores franjas y energía.
4. Mantenimiento → dosis mínima efectiva.
5. Juego / deporte → se conserva ajustando intensidad.

**Las 8 reglas:** función antes que ego; interferencia controlada; variedad con propósito (los deportes cuentan como entrenamiento, se integran); piernas prioritarias; muñecas entrenables (dolor persistente no se normaliza); base aeróbica primero; comer para adaptarse; diversión sostenible (≥1 sesión/semana elegida por disfrute).

**Revisión:** cada 4–6 semanas.

### 6.2 Estadísticas, horizontes y objetivos (documento 02)

**Estadísticas (5 dimensiones):**

| Stat | Definición | Indicador |
|---|---|---|
| MASA | 85–88 kg atlético, cintura controlada | Peso medio 7 d, cintura, fotos |
| FUERZA | Torso fuerte; piernas dejan de ser limitante | Marcas relativas a peso + RPE |
| MOTOR | Base aeróbica para 23 km trail | Duración fácil, trail largo, recuperación |
| CONTROL | Handstand sólido, movilidad avanzada | Skill tests + rangos |
| AVENTURA | MTB, escalada, natación, surf, skate mejoran o se mantienen | Sensación + rendimiento de campo |

**Cómo se calcula el número de cada stat en la ficha (0–100, etapa 3):**
- MASA: progreso del peso medio desde `startWeightKg` hacia 85 kg, con penalización si la tendencia semanal > 0,40 %.
- FUERZA: media del % de mejora frente a baseline en press banca, dominada lastrada, trap bar y split squat (a mismo RIR), acotado.
- MOTOR: minutos Z2 semanales / 150 (acotado) ponderado con duración de la ruta más larga / 60 min.
- CONTROL: mejor handstand en pared (s) / 60 + nº de rangos de movilidad mejorados / 4.
- AVENTURA: nº de ventanas de Zona Salvaje completadas en las últimas 4 semanas / 4 + nota de transferencia (mejor/igual/peor).
Hasta tener datos, el stat muestra "—".

**Horizontes:** 12 semanas → 29 nov 2026 · 6 meses → 6 mar 2027 · 12 meses → 6 sep 2027 · 3 años → 6 sep 2029.

**Scorecard 3 años (brújula, no meta inmediata):** 85–88 kg · dominada +40 kg ×3–5 · fondos +40–50 kg ×3–5 · press banca 1,25–1,40×PC · sentadilla ~1,4–1,6×PC · trap bar ~1,7–2,0×PC · unilateral fuerte y simétrico sin calambres · handstand 30–60 s · trail 23 km disfrutable · natación 1.500–2.000 m · MTB 3–4 h · yoga avanzado.

**Objetivos 6 meses:** +2 a +4 kg vs baseline; 2 sesiones de pierna/sem toleradas; 2–3 estímulos aeróbicos/sem, 120–180 min; carrera fácil 60–75 min; apoyos sin dolor; adherencia ≥ 85 %.

**Objetivos 12 meses:** +4 a +7 kg si la calidad es buena; sesiones de sentadilla sin calambres recurrentes; mantener/mejorar dominadas y fondos lastrados; 3–4 h aeróbicas en semanas específicas; trail 15–23 km; handstand libre 10–30 s.

**Objetivos SMART del Bloque 1 (12 semanas, hasta 29 nov 2026)** — la app los muestra en LIGA y los evalúa automáticamente donde sea posible:

| # | Objetivo | Meta | Validación automática |
|---|---|---|---|
| 1 | Baseline completo | Ficha cerrada en semana 1–2 | Perfil con peso medio 7 d + ≥3 baselines de fuerza + test movilidad |
| 2 | Piernas entrenables | 4 semanas consecutivas de Lower sin calambre recurrente ni dolor creciente | `adductorAfter` ≤ 3 en todas las sesiones Lower de 4 semanas seguidas |
| 3 | Fuerza unilateral | +15–25 % en split squat/step-up vs baseline al mismo estándar | carga×reps vs baseline |
| 4 | Mantener torso | No perder rendimiento relativo en dominadas/fondos | (carga+PC)/PC × reps ≥ baseline |
| 5 | Base aeróbica | 90–150 min/sem fáciles sostenibles | suma minutos `countsAs='z2'` |
| 6 | Carrera progresiva | Una sesión fácil continua de 45–60 min | RouteLog run ≥ 45 min con rpe ≤ 6 y sin dolor 24 h |
| 7 | Muñecas | Tolerancia sin síntomas crecientes | tendencia `wrist` no creciente + carga de apoyo tolerada |
| 8 | Handstand / movilidad | Mejorar 1 marcador de handstand y 2 rangos | LeagueTest vs anterior |
| 9 | Composición | Ganancia 0,15–0,30 % del peso/semana en semanas de construcción | media móvil 7 d |
| 10 | Recuperación | Sueño ~8 h; sin caída sostenida > 7 días | check-ins |

**Criterio de éxito del bloque:** piernas dejan de limitar, aparece base aeróbica, torso se mantiene, peso responde, muñecas toleran más carga. No hace falta cumplir las 10.

**Dashboard:** KPIs semanales (peso medio 7 d; sesiones prioritarias ≥ 85 %; RPE/energía/sueño; síntomas aductor/muñeca; minutos aeróbicos; marcas de fuerza cada 1–2 semanas) e indicadores cada 4 semanas (composición, torso submáximo a RIR fijo, split squat/step-up + bilateral, sesión fácil estándar comparada, vídeo handstand + movilidad, nota de transferencia).

**Semáforo global:** VERDE (rendimiento estable/sube, sueño bueno, síntomas ≤ 2/10 que desaparecen rápido) → progresar. ÁMBAR (2+ señales de fatiga 4–7 días; molestias que aumentan; apatía; pérdida de rendimiento) → −20–30 % volumen, mantener técnica, reevaluar. ROJO (dolor agudo, inflamación, debilidad, síntomas neurológicos, dolor persistente) → detener la carga implicada y buscar valoración profesional.

**Reglas de revisión:** no cambiar el plan por una mala sesión aislada; una variable principal cada vez (volumen, intensidad, frecuencia o calorías); 2 semanas de estancamiento con buena recuperación → progresar; con fatiga → descargar.

### 6.3 Roadmap de fases (Formas)

| Forma | Periodo | Objetivo dominante | Condición de evolución (checkpoint) |
|---|---|---|---|
| I · Base | Sep–Nov 2026 | Piernas, tolerancia aductores/muñecas, base aeróbica, baseline | Piernas entrenables sin calambres recurrentes; muñecas toleran apoyos; 90–150 min/sem aeróbico fácil; peso e ingesta monitorizados |
| II · Construcción | Dic 2026–Mar 2027 | Hipertrofia global con énfasis piernas + carrera fácil | Mejora visible de masa y piernas; fuerza unilateral claramente superior; carrera fácil estable; primera salida trail sin vaciar piernas |
| III · Integración | Abr–Ago 2027 | Transferir masa/fuerza a trail, MTB y skills | Físico más atlético; tren inferior ya no es cuello de botella; 15–23 km trail; handstand y movilidad mejoran |
| IV · Híbrido | Sep 2027–Sep 2029 | Bloques alternos | Alternar bloques sin reconstruir desde cero |

La evolución se propone cuando se cumplen las condiciones, nunca solo por fecha. Daniel confirma manualmente.

### 6.4 Semana base (documento 04)

| Día | AM · prioridad | PM · complemento | Combustible |
|---|---|---|---|
| Lunes | CANTERA (Lower A) 60' | Natación suave 25–40' + sauna opcional | ALTA |
| Martes | YUNQUE (Upper A) 60' | Ruta carrera Z2 45–55' | MEDIA-ALTA (doble → ALTA) |
| Miércoles | Yoga / movilidad 40–60' | Escalada o skate técnico 45–60' RPE ≤ 6 | MEDIA |
| Jueves | RESORTE (Lower B) 60' | OFF · paseo y movilidad breve | ALTA |
| Viernes | VÉRTIGO (Upper B) 60' | Ruta opcional bici o natación 40–60' | MEDIA-ALTA |
| Sábado | ZONA SALVAJE (MTB / trail / surf / escalada exterior) | OFF | MUY ALTA si > 90' |
| Domingo | Yoga suave + paseo 30–45' o descanso total | OFF · Consejo de la Liga | MEDIA-BAJA |

**Presupuesto:** 4 h fuerza · 2–3 h aeróbico · 1–2 h movilidad/técnica · 1–2 h deporte libre. 8–10 h semana base, 10–12 h con aventura larga. 20 h/semana es un techo, no un objetivo.

**Prioridades:** A no negociable = 2 Lower + 2 Upper + 1 Z2 + 1 movilidad. B = 2.º Z2 + natación suave + juego técnico (entra por sustitución). C = sesión recreativa adicional solo si todo está verde.

**Versiones de semana (plantillas):**
- **Estándar:** la de arriba.
- **Montaña / MTB fuerte:** igual, pero viernes sin PM y domingo recuperación total.
- **Surf / skate:** miércoles yoga + skate; viernes Upper B + natación; sábado surf.
- **Fatiga / trabajo:** Lower A reducido (45'), Upper A, OFF/yoga, Lower B reducido, Upper B o OFF, Z2/aventura fácil, OFF.
- **Viaje:** 2 full-body de mantenimiento + running/Z2 + movilidad; parque de calistenia; sin compensar al volver.
- **Mínimo viable (semana de estrés):** 2 Lower + 2 Upper + 1 Z2 + 1 movilidad. Si ni eso cabe: 3 fuerzas full-body/upper-lower.

**Orden de recorte:** C opcional → B complementario → reducir volumen de A → descanso completo. Nunca recuperar sesiones perdidas en 48 h.

### 6.5 Los cuatro gimnasios (documento 05) — contenido exacto

**Reglas operativas:** 55–70 min; mayoría del trabajo RIR 2–3, solo series finales RIR 1, sin fallo habitual; doble progresión (primero reps dentro del rango, luego +2,5–5 % carga); si la técnica se degrada, la serie termina; 48–72 h entre Cantera y Resorte; Upper puede convivir con Z2, natación suave o yoga el mismo día.

#### CANTERA · LOWER A · sentadilla, cuádriceps y aductores · coste ALTO · tipos fuerza, masa

Calentamiento (9–11 min, obligatorio):
1. Bicicleta/remo suave · 4 min · subir temperatura.
2. Knee-to-wall tobillo · 1×8/lado · talón pegado.
3. Adductor rock-back · 1×8/lado · rango cómodo.
4. Copenhagen corto isométrico · 2×15–20 s/lado · sin dolor, pelvis estable.
5. Sentadilla peso corporal con pausa · 2×6 · 2 s abajo.

| Slot | Ejercicio | Series×reps | RIR | Descanso | Nota | Paso carga |
|---|---|---|---|---|---|---|
| A1 | Hack squat o goblet squat con talones elevados | 4×6–8 | 3→2 | 2:30–3:00 | 3 s bajada, pausa suave, subir firme | 5 kg (goblet 2 kg) |
| A2 | Peso muerto rumano | 3×6–8 | 2 | 2:00–2:30 | Cadera atrás, columna neutra | 5 kg |
| A3 | Bulgarian split squat | 3×8/lado | 2 | 1:30 | Rodilla sigue línea del pie | 2 kg |
| A4 | Prensa / extensión de rodilla | 2×10–12 | 2 | 1:15 | Volumen, no grind | 5 kg |
| A5 | Elevación de gemelo de pie | 3×10–15 | 1–2 | 1:00 | 1 s arriba + estiramiento abajo | 5 kg |
| A6 | Copenhagen corto o aducción en polea | 2×20–30 s / 2×12 | 2–3 | 0:45 | Aductor específico | 2,5 kg |

Transición a sentadilla con barra: si 3–4 semanas de patrón estable y calambres post-sentadilla desaparecen o bajan claramente (`adductorAfter` ≤ 2 en 3 semanas seguidas), la app ofrece sustituir A1 por high-bar squat 3–4×5–8 RIR 3→2. Si el síntoma vuelve, regresa a la variante tolerada.

Fueling: pre 90–150' → 30–40 g proteína + 80–120 g CH (arroz + pollo + fruta; o yogur + avena + plátano + miel). Al levantarse: 20–30 g prot + 40–70 g CH (batido + plátano + tostadas/miel). 500–750 ml agua en 2 h previas; sodio si sauna. Post 0–2 h → 30–40 g prot + 80–120 g CH.

Versiones: 45' = calentamiento + A1, A2, A3 + A6. 60' = todo salvo A5 si vas justo. 75' = todo + correctivos + 8–12' natación muy suave opcional (no añadir series duras).

#### YUNQUE · UPPER A · fuerza y masa de torso · coste MEDIO · tipos fuerza, masa

Preparación de muñeca y escápula (7–9 min, obligatoria): rocking de muñeca en cuadrupedia 2×8 direcciones; prono/supinación con mancuerna ligera 1×10/lado; band pull-apart 1×15 + scapular pull-up 1×8; 2–4 series de aproximación press + dominada.

| Slot | Ejercicio | Series×reps | RIR | Descanso | Nota | Paso carga |
|---|---|---|---|---|---|---|
| A1 | Press banca | 4×5–8 | 2 | 2:30–3:00 | Pausa breve en pecho | 2,5 kg |
| A2 | Dominada lastrada | 4×5–8 | 2 | 2:30–3:00 | Inicio escapular; lastre = carga | 2,5 kg |
| A3 | Press inclinado con mancuernas | 3×8–10 | 2 | 1:30 | Agarre cómodo para muñeca | 2 kg |
| A4 | Remo pecho apoyado | 3×8–12 | 2 | 1:30 | Sin compensación lumbar | 2,5 kg |
| A5 | Elevación lateral | 3×12–20 | 1–2 | 0:45–1:00 | Control | 1 kg |
| A6 | Curl + tríceps cuerda (superset) | 2×10–15 cada | 1–2 | 0:30 | Estético y eficiente | 2,5 kg |

Fueling: pre 25–35 g prot + 60–90 g CH; si comida completa 2–3 h antes, una fruta basta. Post 25–40 g prot + 60–100 g CH (extremo alto si hay natación o Z2 el mismo día).

Versiones: 45' = prep + A1, A2, A3 + A4. 60' = todo salvo A6. 75' = todo.

#### RESORTE · LOWER B · cadena posterior, unilateral y potencia · coste ALTO · tipos fuerza, aventura

Calentamiento y potencia (10–12 min, obligatorio):
1. Bici suave · 3 min.
2. 90/90 hip switches · 1×8.
3. Adductor rock-back · 1×8/lado.
4. Pogo hops o saltos bajos · 2×15–20 contactos · 45–60 s descanso · elástico y silencioso.
5. Box jump / broad jump submáximo · 3×3 · 60–75 s · parar si pierdes altura.

| Slot | Ejercicio | Series×reps | RIR | Descanso | Nota | Paso carga |
|---|---|---|---|---|---|---|
| B1 | Trap-bar deadlift | 4×4–6 | 3→2 | 2:30–3:00 | Potente, sin reps lentas | 5 kg |
| B2 | Split squat con pie delantero elevado | 3×8/lado | 2 | 1:30 | Profundidad progresiva | 2 kg |
| B3 | Hip thrust | 3×8–10 | 2 | 1:30 | Bloqueo con glúteo | 5 kg |
| B4 | Curl femoral sentado/tumbado | 3×10–12 | 1–2 | 1:15 | Excéntrica controlada | 2,5 kg |
| B5 | Lateral lunge | 2×8/lado | 3 | 1:00 | Plano frontal | 2 kg |
| B6 | Tibialis raise + gemelo sentado | 2×15–20 + 12–15 | 2 | 0:45 | Tobillo útil | 2,5 kg |

Fueling: como Cantera (80–120 g CH + 30–40 g prot pre si hay 90–150'). No llegar bajo de CH a saltos + trap bar. Post 30–40 g prot + 80–120 g CH; extremo alto si mañana hay trail/MTB.

Versiones: 45' = calentamiento/potencia + B1, B2, B3 + B5. 60' = todo salvo B6 si vas justo. 75' = todo + correctivos.

#### VÉRTIGO · UPPER B · calistenia, hombro y handstand · coste MEDIO · tipos control, fuerza

Bloque técnico de muñeca + handstand (10–12 min, obligatorio, va primero porque se hace fresco): rocking de muñeca + finger pulses 1–2×8 + 10 (solo rango cómodo); wall handstand pecho a pared 4×20–40 s (bajar antes de colapsar); shift de hombros / toe pulls 2×4–6 solo si la muñeca está tranquila (`wrist` ≤ 2 hoy).

| Slot | Ejercicio | Series×reps | RIR | Descanso | Nota | Paso carga |
|---|---|---|---|---|---|---|
| B1 | Fondos lastrados | 4×6–8 | 2 | 2:00–2:30 | Baseline +20 kg como referencia, no obligación | 2,5 kg |
| B2 | Chin-up / dominada neutra | 3×6–10 | 2 | 2:00 | Alternar agarre según codo/muñeca | 2,5 kg |
| B3 | Press militar mancuernas o landmine press | 3×8–10 | 2 | 1:30 | Variante amable con muñeca | 2 kg |
| B4 | Remo cable unilateral | 3×10–12/lado | 2 | 1:15 | Control escapular | 2,5 kg |
| B5 | Reverse fly / face pull | 2×15–20 | 2 | 0:45 | Deltoide posterior | 2,5 kg |
| B6 | Elevación lateral + curl martillo (superset) | 2×15–20 + 10–15 | 1–2 | 0:30 | Corto | 1 kg |
| B7 | Hanging knee raise / dead bug | 2–3×8–15 | 2 | 0:45 | Core sin fallo | — |

Fueling: pre 25–35 g prot + 50–90 g CH; post 25–40 g prot + 50–90 g CH (subir si mañana Lower o deporte largo). Si yoga después: 15–30 min de margen.

Versiones: 45' = bloque técnico + B1, B2, B3 + B4. 60' = todo salvo B6. 75' = todo.

#### Progresión del bloque (aplica a los 4 gimnasios)

| Semanas | Objetivo | Main lifts | Accesorios | Sensación |
|---|---|---|---|---|
| 1–3 | Aprendizaje + volumen base | RIR 3→2, parte baja del rango | RIR 2–3 | Sales con margen |
| 4 | Descarga | −30 a −40 % series, RIR 4 | Mitad de volumen | Fresco |
| 5–7 | Sobrecarga | RIR 2, subir reps/carga | RIR 2 | Sólido |
| 8 | Descarga | −30 a −40 % series | Mitad de volumen | Recuperación |
| 9–11 | Consolidación | RIR 2→1 en última serie selecta | RIR 1–2 | Intenso, técnico |
| 12 | Revisión | Sin 1RM; comparar cargas a mismo RIR | Reducido | Medir |

**Doble progresión (ejemplo del doc):** press banca 4×5–8. Si 8/8/8/8 con RIR 2 y técnica estable → siguiente sesión + incremento mínimo y volver a 5–6 reps. Si 8/8/7/6 → conservar carga.

**Cuándo NO subir carga:** RIR real por debajo del objetivo 2 sesiones seguidas; técnica cambia para salvar la rep; dolor articular o calambre de aductor aumenta; sesión dura de trail/MTB/surf el día anterior; sueño caído varias noches.

**Si llegas fatigado:** VERDE → plan completo. ÁMBAR (sueño mediocre / piernas pesadas / deporte previo) → misma técnica, −1 serie en accesorios y RIR +1. ROJO (dolor articular, enfermedad, calambre fuerte recurrente, caída grande de rendimiento) → no forzar: técnica suave, movilidad o descanso.

**Registro mínimo tras cada sesión:** carga×reps de A1/A2 (o B1/B2) y RIR final; energía inicio/fin 1–5; muñeca 0–10 durante apoyos; aductor 0–10 durante y 30–60 min después de Lower; "fácil/normal/pesado"; deporte en las 24 h previas.

### 6.6 Microdosis de muñeca y aductor (documentos 04 y 05)

**Muñecas · 8–12 min · 3×/semana (2–4 según 05):**

| Bloque | Contenido | Dosis | Progresión |
|---|---|---|---|
| Movilidad | Círculos, flex/extensión suave, prono/supinación | 2–3 min | — |
| Carga isométrica | Apoyos progresivos pared/banco/suelo | 3×20–30 s | Más rango antes que más carga |
| Fuerza | Extensión excéntrica 2×12/lado; flexión 2×12/lado; prono/supinación 2×10/lado; extensor de dedos con banda 2×20; rocking en apoyo 2×8 | — | +0,5–1 kg cuando sea fácil y sin dolor; palanca antes que peso |
| Handstand prep | Lean o apoyo técnico | 2–4 series cortas | Sin dolor creciente |

Alerta: dolor localizado persistente, pérdida de fuerza, hormigueo o limitación creciente → valoración profesional antes de seguir aumentando apoyos/lastre.

**Aductores · 2–3×/semana:** Copenhagen corto isométrico 2×20–30 s/lado; aducción en polea 2×10–15/lado; lateral lunge 2×6–10/lado; adductor rock-back 1×8/lado. Antes de Lower: 5–8 min general + movilidad dinámica cadera/tobillo + isométricos de aductor de baja dosis + series de aproximación. Después: respiración + movilidad suave; registrar si aparece calambre y a qué intensidad. Calambres frecuentes, severos, con dolor/hinchazón/debilidad o que no mejoran → evaluación profesional.

**Movilidad mínima semanal:** 2× yoga/movilidad 40–60' · 3× muñeca 8–12' · 2× tobillo/cadera pre-Lower · 1× sesión regenerativa.

### 6.7 Rutas y Zona Salvaje (documento 04)

**Reglas de interferencia (las 7):**
1. Piernas primero: si el día es Lower, llega fresco; cardio previo solo calentamiento.
2. Duro + fácil en dobles; nunca duro + duro de piernas.
3. 24 h de protección: sin intervalos ni desnivel fuerte en las 24 h previas a Lower.
4. El sábado manda: si la aventura sale intensa, viernes PM se elimina y domingo es recuperación real.
5. Running conservador: en las 12 semanas casi todo Z2.
6. Escalada cuenta como upper: boulder duro sustituye parte de Vértigo.
7. Dolor ≠ adaptación.

**Semáforo de compatibilidad (mismo día):**

| Combinación | Lectura |
|---|---|
| Lower AM + natación suave PM | VERDE |
| Upper AM + running Z2 PM | VERDE |
| Yoga AM + escalada técnica PM | VERDE (vigilar muñeca) |
| Upper + natación Z2 | VERDE si hombros bien |
| Lower AM + running intenso PM | ROJO |
| Lower + MTB fuerte | ROJO |
| MTB duro sábado + trail largo domingo | ROJO (elegir uno; el otro pasa a paseo/yoga) |
| Trail largo + gimnasio de pierna | ROJO |
| Escalada dura + upper pesado mismo día | ÁMBAR (reducir volumen en uno) |
| Skate suave + Z2 | ÁMBAR (ok si técnico y piernas frescas) |

**Matriz de sustituciones (nunca añadir: intercambiar):**

| Aparece | Puede sustituir | No debe sustituir | Ajuste |
|---|---|---|---|
| MTB 90–150' con desnivel | Z2 viernes + Zona Salvaje | Lower A/B | Reduce carrera esa semana si piernas cargadas |
| Trail 60–90' | Running Z2 + Zona Salvaje | Lower A/B | Ritmo conversacional al inicio |
| Surf 60–120' | Zona Salvaje / natación | Lower | Si exige mucho, cuenta como carga media torso+piernas |
| Escalada / boulder duro | Deporte miércoles + parte de Vértigo | Lower | Reduce tirón/antebrazo del gym |
| Skate 45–90' | Deporte miércoles o Z2 opcional | Lower | Si hay saltos, no es recuperación |
| Natación técnica suave | Z2 opcional / recuperación | Fuerza | Excelente PM tras gym |
| Yoga intenso | Movilidad del miércoles | Fuerza | Cuenta como sesión media |

**Escenarios de semana viva:** olas el sábado → surf reemplaza Zona Salvaje y se elimina viernes PM si prevés 2 h; MTB con amigos el domingo → sábado pasa a descanso/skill suave y el Lower A del lunes se ajusta si piernas pesadas; semana de mucha escalada → miércoles escalada dura, Vértigo reduce tirón/antebrazo, mantener los dos Lower; viaje → 2 full-body + Z2 + movilidad; fatiga laboral → eliminar C, luego B, luego reducir A.

**Progresión del aeróbico por ola:** sem 1–3: 2× Z2 40–55'; aventura 60–90' fácil/moderada · sem 4 deload: −25–35 % duración, solo fácil · sem 5–7: 2× Z2 45–60'; aventura 75–120' · sem 8 deload · sem 9–11: Z2 + una progresión suave si todo verde; aventura 90–150' opcional · sem 12: test submáximo en ruta conocida.

**Clasificación de una ruta:** RPE ≤ 6 y conversacional = `z2`; RPE 7 = `medio`; RPE ≥ 8 = `duro` (la app avisa "la ruta se ha vuelto combate").

### 6.8 Recuperación (documentos 04 y 06)

Orden de importancia: sueño 8–8,5 h → energía/comida → hidratación → gestión de carga → movilidad/paseo → sauna/contraste.

**Chequeo matinal de 30 s:**

| Señal | Verde | Ámbar | Rojo |
|---|---|---|---|
| Sueño | ≥ 7,5–8 h sólido | 6–7,5 h | Muy pobre + somnolencia |
| Piernas | Normales | Pesadas | Dolor / fatiga profunda |
| Muñecas | Sin aumento de dolor | Rigidez leve | Dolor creciente |
| Motivación | Normal | Baja puntual | Rechazo + rendimiento bajo |
| Peso/apetito | Estables | Apetito bajo | Pérdida no buscada |

Decisión: 1 ámbar → entrenar y observar. 2–3 ámbar → −20–30 % volumen o convertir B/C en recuperación. 1 rojo claro → modificar la sesión. Varios rojos → descanso y revisión.

**Mochila (objetos) y su regla:**

| Objeto | Regla |
|---|---|
| Creatina monohidrato | 3–5 g/día, diaria, el momento no importa |
| Whey/caseína | Opcional; solo para llegar al total de proteína |
| Cafeína | ~1–3 mg/kg antes de sesiones clave; evitar si afecta sueño |
| Electrolitos/sodio | Sesiones largas, calor, sudor elevado, sauna |
| Vitamina B12 | Según pauta; no aumentar "por rendimiento" |
| Vitamina D / Omega-3 | No automáticos; por analítica/dieta |
| Sauna | Entrar hidratado; reponer después; si mareo/cefalea, dosis excesiva |
| Frío/contraste | Separado de la sesión de fuerza si la prioridad es hipertrofia |
| Siesta | 15–30 min si ayuda y no estropea la noche |
| Paseo | 10–30 min tras comida o por la tarde |
| Batido de ganancia | Leche + plátano + whey/yogur + avena + crema de cacahuete + miel si falta CH; no sustituye comidas |

No necesitamos: BCAA, mass gainers, pre-entrenos, quemagrasas, detox.

### 6.9 Nutrición (documento 03)

**Regla maestra:** medir mantenimiento real 14 días (semanas 1–2: registrar comida y pesarse 5–7 días/sem al levantarse) → superávit pequeño → media de peso sube 0,10–0,25 %/semana con cintura, rendimiento y digestión bajo control.

**Algoritmo quincenal:**

| Situación en 2 semanas | Decisión |
|---|---|
| Peso estable y quiere ganar | +200 a +300 kcal/día sobre la media real |
| Sube < 0,10 %/sem | +150 a +200 kcal/día |
| Sube 0,10–0,25 %/sem | Mantener (zona objetivo) |
| Sube > 0,35–0,40 %/sem y cintura acelera | −150 a −200 kcal/día |
| Rendimiento cae / hambre extrema | Revisar carga, CH y recuperación antes de recortar |

**Fases nutricionales del bloque:** sem 1–2 medir; sem 3–5 +200–300 kcal si estable; sem 6–8 ajustar ±150–200 y practicar fueling en MTB/trail; sem 9–11 mantener; sem 12 recalibrar.

**Macros:** proteína 1,8–2,2 g/kg/día en 4–5 tomas de 0,3–0,4 g/kg separadas 3–5 h; grasas 0,8–1,0 g/kg; CH = resto (suben en pierna, running, MTB y dobles); fibra 25–40 g; agua 30–40 ml/kg + deporte.

**Tipo de día (Combustible):**

| Tipo de día | Energía | Desayuno | Comida | Merienda pre | Cena/post |
|---|---|---|---|---|---|
| Pierna + natación suave | ALTA | ALTO CH + prot | ALTO CH | CH fácil + prot | ALTO CH + prot |
| Torso + calistenia | MEDIA-ALTA | Medio-alto | Alto | Moderado | Medio-alto |
| AM Z2 + PM fuerza | ALTA/MUY ALTA | Alto | Muy alto | Alto | Alto |
| Trail / MTB largo | MUY ALTA | Muy alto | Post muy alto | Según hambre | Alto + sal/líquidos |
| Yoga / movilidad | MEDIA | Medio | Medio | Opcional | Medio |
| Descanso | MEDIA-BAJA | Medio | Medio | Opcional | Medio, menos almidón |

**Timing:** pre fuerza 90–180' → CH 0,75–1,5 g/kg + prot 0,25–0,35 g/kg, grasa/fibra moderadas. Post → comida normal; si otra sesión < 8 h, CH + prot pronto. Aeróbico: < 60' fácil → agua; 60–120' → 30–60 g CH/h; > 2 h → 60–90 g/h progresivo; calor → sodio. Doble sesión: no llegar vacío a la segunda.

**Micronutrientes:** fruta 3–4/día; verdura 2–3 raciones; legumbres 2–4/sem; pescado 2–4/sem (azul incluido); huevos/lácteos regular; frutos secos 1 ración/día; sal yodada.

**Snack toolkit (300–600 kcal):** yogur griego + granola + plátano + miel; bocadillo pavo/queso + fruta; leche + whey + avena + plátano + crema de cacahuete; arroz con leche / yogur + cereal; pan con tomate + tortilla + AOVE.

**Checklist diario:** proteína ✓ · 3–4 frutas ✓ · 2+ verduras ✓ · hidratar ✓ · fuel pre/post ✓.

**Dashboard nutricional:** peso al despertar 5–7×/sem (media); cintura 1×/sem; rendimiento; energía/hambre 1–5; digestión; sueño; fueling en salidas largas.

### 6.10 Tests de Liga (cada 4 semanas: semanas 4, 8 y 12)

| Área | Test repetible |
|---|---|
| Composición | Peso medio 7 d + cintura + 3 fotos comparables (fotos fuera de la app en etapas 1–3; solo nota) |
| Torso | Dominada y fondo lastrado submáximo a RIR 2 fijo |
| Piernas | Split squat o step-up (carga×reps por lado) + patrón bilateral técnico |
| Motor | Ruta fácil estándar: mismo recorrido/tiempo, comparar RPE/FC |
| Control | Handstand en pared (s) y libre si existe + tobillo (knee-to-wall cm), cadera, hombro, muñeca |
| Transferencia | Nota: MTB, escalada, surf/skate ¿mejor, igual o peor? |

**Medallas del Bloque 1:**

| Medalla | Condición | Cálculo de progreso |
|---|---|---|
| CANTERA | 4 semanas consecutivas de Lower sin calambre recurrente ni dolor creciente (SMART 2) | semanas consecutivas con `adductorAfter` ≤ 3 en Cantera y Resorte / 4 |
| YUNQUE | Mantener fuerza relativa de dominada y fondo (SMART 4) con peso subiendo | test sem 8 o 12 ≥ baseline en (carga+PC)×reps/PC |
| RESORTE | +15 % en split squat/step-up vs baseline (SMART 3) | (mejor carga×reps actual / baseline) − 1, sobre 0,15 |
| VÉRTIGO | Muñecas sin síntomas crecientes 8 semanas + 1 marcador de handstand mejorado (SMART 7 y 8) | tendencia `wrist` + test |

**Nivel de entrenador:** % de sesiones A (anclas) completadas en las últimas 4 semanas. ≥ 85 % = "Entrenador de Liga"; 70–84 % = "Entrenador"; < 70 % = "Aprendiz". Las semanas marcadas como viaje/enfermedad no cuentan.

---

## 7. Motor de reglas (`src/domain/rules`) — especificación exacta

Cada regla es una función pura con tests. Cada aviso que produce lleva `{ level: 1|2|3|4|5, message, source }` donde `level` es el nivel de la jerarquía de la Constitución que protege y `source` la referencia al documento (p. ej. "06 §6").

### R1 · PV y estado (`pv.ts`)
```
sleepScore   = sleep ≥ 7.5 → 25 · 6.5–7.4 → 15 · 6–6.4 → 8 · < 6 → 0
energyScore  = (energy − 1) / 4 × 25
legsScore    = (legs − 1) / 4 × 25
painScore    = 25 − max(wrist, adductor) × 2.5      (0 si ≥ 10)
pv = round(sleepScore + energyScore + legsScore + painScore)     // 0–100
greens = [sleep ≥ 7.5, energy ≥ 4, legs ≥ 4, max(wrist,adductor) ≤ 2].count(true)
status:
  KO      si wrist ≥ 5 o adductor ≥ 5, o si el síntoma ha subido en 3 check-ins seguidos, o greens ≤ 1
  CARGADO si greens == 2, o pv < 60
  OK      en otro caso
```
Efecto sobre la sesión del día: OK → plan completo. CARGADO → −1 serie en accesorios, RIR +1, sesión PM pasa a recuperación u opcional. KO → sesión reducida a técnica suave/movilidad; si el KO viene de muñeca, Vértigo omite handstand y fondos; si viene de aductor, Cantera/Resorte se sustituyen por movilidad + Copenhagen isométrico de baja dosis y mensaje de valoración profesional si persiste 3 registros.

### R2 · Doble progresión (`progression.ts`)
Entrada: `ExerciseSpec`, últimas 2 `ExerciseLog` del mismo ejercicio, `status` de hoy, `wave`.
```
si wave == 'deload' → sugerir la carga de la última sesión no-deload × 0.9, series × 0.65 redondeado abajo (mín. 2), RIR 4
si todas las series de la última sesión alcanzaron repMax con rir ≥ rirTarget → carga + loadStepKg (o +2.5–5 %, el mayor), objetivo repMin–repMin+1
si no → misma carga, objetivo: completar el rango
bloqueos (no subir): rir real < objetivo en las 2 últimas sesiones; feel == 'pesado' en la última; status != 'ok'; WildLog dura en las 24 h previas; 3 últimos check-ins con sleep < 7
```
Salida: `{ loadKg, repTarget: [min,max], sets, rir, reason }`. La `reason` se muestra al usuario ("subo 2,5 kg porque completaste 8/8/8/8 a RIR 2").

### R3 · Descargas (`deload.ts`)
`weekOfBlock ∈ {4, 8}` → `wave = 'deload'`: series −30/−40 % (main × 0.65, accesorios × 0.5), RIR 4, Z2 −25/−35 % duración, aventura solo fácil. `weekOfBlock == 12` → `wave = 'eval'`: volumen reducido, tests de Liga activos. Olas: 1–3 → 1, 5–7 → 2, 9–11 → 3.

### R4 · Interferencia (`interference.ts`)
Al planificar o registrar, evalúa el día y el día siguiente con la tabla 6.7. Devuelve VERDE/ÁMBAR/ROJO + mensaje. ROJO impide colocar en el planificador sin confirmación explícita ("Sé lo que hago"). Reglas de 24 h: si hay Lower mañana, hoy no admite ruta `duro` ni Zona Salvaje `dura`.

### R5 · Sustitución (`substitution.ts`)
Al registrar un `WildLog`: aplica la matriz 6.7 sobre la `WeekPlan` de la semana actual y propone una lista de cambios (eliminar Z2 opcional viernes, convertir domingo en recuperación total, reducir tirón en Vértigo, avisar sobre Lower del lunes si `intensity == 'dura'` y minutos ≥ 90). Daniel acepta o rechaza cada cambio. Se guarda en `WeekPlan.substitutions`.

### R6 · Combustible (`fuel.ts`)
`DayFuel` = f(items del día): Lower o doble sesión → ALTA; AM Z2 + PM fuerza → ALTA; Zona Salvaje ≥ 90' → MUY ALTA; Upper solo → MEDIA-ALTA; yoga/movilidad → MEDIA; OFF → MEDIA-BAJA. Devuelve además la plantilla pre/post de la sesión concreta (textos de 6.5) y, para aventura, la guía intra por duración.

### R7 · Peso y calorías (`weight.ts`)
Media móvil 7 d de `weightKg` (ignora huecos). Tendencia semanal = (media esta semana − media semana anterior) / media anterior. Cada 14 días desde `blockStart` evalúa el algoritmo 6.9 y propone un `Adjustment{kind:'kcal'}` con el texto exacto de la tabla. Semanas 1–2 solo miden (no propone). Si pierde peso con buena recuperación → "añade comida"; si pierde peso y está agotado → "revisa carga + energía antes de añadir más comida a ciegas".

### R8 · Síntomas (`symptoms.ts`)
Serie temporal de `wrist` y `adductor` (check-ins + sesiones). Tendencia creciente = 3 registros consecutivos cada uno mayor que el anterior. Umbrales: ≥ 5 → KO en ese patrón; creciente 3 seguidos → aviso nivel 1 "reduce exposición"; persistente ≥ 4 durante 7 días → mensaje "valoración por fisioterapeuta o médico deportivo" (nivel 1, no se puede descartar sin leerlo). Transición a sentadilla con barra (6.5) se ofrece cuando `adductorAfter` ≤ 2 en las 3 últimas semanas de Cantera.

### R9 · Mínimo viable y recorte (`minimum.ts`)
`template = 'fatiga'|'viaje'` o 3+ días CARGADO/KO en la semana → aplica el orden de recorte: primero elimina items C, luego B, luego reduce versión de A a 45', luego propone OFF. Nunca propone añadir sesiones para compensar. Mensaje fijo: "No hay deuda."

### R10 · Progreso del bloque, medallas y evolución (`league.ts`)
Calcula progreso de cada SMART (tabla 6.2), progreso de medallas (6.10), nivel de entrenador, y condiciones de evolución Forma I→II (6.3). Genera el **informe de 12 semanas** en Markdown (sección 10).

### R11 · Consejo de la Liga (`council.ts`)
Scorecard de la semana (tabla 04.8): Lower 2/2, Upper 2/2, Z2 1+1, movilidad 2, aventura 1, sueño, tendencia de peso, dolor progresivo. Semáforo por métrica. Los 7 pasos del domingo como wizard: contexto → anclas → motor → aventura → comida → recuperación → plan B. Salida: `WeekPlan` de la semana siguiente + informe Markdown para el Rival.

---

## 8. Pantallas

Navegación inferior de 5 pestañas con `safe-area-inset-bottom`: **HOY · GYM · RUTAS · LIGA · REGEN**. Ajustes desde la ficha del entrenador. Todo usable con una mano; controles ≥ 44 px.

### 8.1 Onboarding (una sola vez) — "Semana 0"
Nombre, altura (1,90 precargado), peso actual, objetivo (85–88 precargado), ventanas AM/PM, fecha de inicio (7 sep 2026), baselines opcionales (press banca, dominada lastrada, fondos lastrados +20 kg precargado, trap bar, split squat), intolerancias/preferencias, ¿contar calorías o sistema visual por porciones? Al terminar crea `Profile` y la `WeekPlan` de la semana 1 con la plantilla estándar.

### 8.2 HOY
- Cabecera: ficha compacta (nombre, Forma, semana N/12, ola, PV barra, estado como pill).
- Check-in si no se ha hecho hoy: 4 controles grandes (sueño en pasos de 0,5 h; energía 1–5; piernas 1–5; muñeca y aductor 0–10 en un mismo control doble) + peso opcional. Un toque "Guardar". Debe completarse en < 30 s.
- Tarjeta AM y PM del plan de hoy con estado de interferencia; si CARGADO/KO, muestra ya la versión ajustada y por qué.
- Tarjeta Combustible: tipo de día + pre/post de la sesión principal + checklist diario (5 ticks).
- Avisos activos (R4, R5, R8) ordenados por nivel de jerarquía.
- CTA principal: "Entrar a [gimnasio]" / "Registrar ruta" / "Zona Salvaje".

### 8.3 GYM (Combate)
- Selector del gimnasio del día (o cualquiera). Versión 45/60/75 (sugerida por estado y tiempo disponible).
- Bloque calentamiento como checklist obligatoria (no se puede empezar el trabajo principal sin marcarla, salvo "ya lo he hecho fuera").
- Lista de ejercicios: para cada uno, sugerencia R2 (carga, reps objetivo, RIR, razón) y la última sesión. Registro de series con teclado numérico grande, botones ±paso de carga, reps, RIR. Ejercicios por lado registran L/R. Isométricos en segundos.
- Temporizador de descanso automático al guardar una serie, con el rango del ejercicio; vibración si el dispositivo lo permite.
- Al terminar: energía fin, muñeca durante, aductor durante, "fácil/normal/pesado", deporte 24 h previas. Recordatorio a los 45 min: "¿aductor 30–60 min después?" (notificación local si se permite; si no, aparece en HOY).
- Resumen del combate: volumen, PRs a mismo RIR, avance de la medalla del gimnasio.

### 8.4 RUTAS
- Registrar: tipo (carrera/bici/natación/paseo), minutos, RPE 1–10, desnivel opcional, nota. Clasificación automática z2/medio/duro con aviso si "la ruta se ha vuelto combate".
- Zona Salvaje: deporte, minutos, intensidad; al guardar, propuesta de sustituciones (R5) con aceptar/rechazar por ítem.
- Contador semanal: minutos Z2 acumulados vs objetivo de la ola (90–150), ruta más larga, próxima ruta planificada. Guía intra de fueling por duración.

### 8.5 LIGA
- Tablero del bloque: 12 casillas con olas y deloads, casilla actual resaltada, fecha final 29 nov.
- Medallas 4 con progreso y condición legible.
- 10 objetivos SMART con progreso automático o manual.
- Combates de Liga (semanas 4/8/12): wizard de test con los 6 apartados de 6.10; comparación con el anterior.
- Evolución: condiciones Forma I→II, botón "Evolucionar" cuando se cumplen (confirmación).
- Índice de Movimientos: todos los ejercicios, tipo, mejor marca a RIR ≤ 2, historial, notas de muñeca/aductor; filtro por gimnasio y tipo.
- Nivel de entrenador (adherencia 4 semanas).

### 8.6 REGEN
- Peso: gráfica SVG de media móvil 7 d con banda objetivo (+0,10–0,25 %/sem), tendencia y próximo ajuste calórico (R7) con el texto del algoritmo.
- Síntomas: dos líneas (muñeca, aductor) últimos 28 días; avisos R8.
- Microdosis: muñeca (3×/sem) y aductor (2–3×/sem) como rutinas guiadas de 8–12 min con contador semanal; yoga/movilidad; paseo; sauna/frío con su regla.
- Mochila: objetos con regla; marcar creatina diaria (único hábito con tick diario).
- Consejo de la Liga (domingo, o cuando quiera): scorecard + wizard de 7 pasos → genera la semana siguiente y el informe para el Rival (copiar al portapapeles / compartir / exportar .md). Botón "Pregunta al Rival" (etapa 3).
- Exportar/importar JSON completo. Ajustes: ventanas, tema, plantilla de semana, unidades, borrar todo.

---

## 9. Roadmap por etapas con criterios de aceptación

### Etapa I · Fundación — "La ficha del entrenador"
**Construir:** repo, tooling, PWA instalable, tokens de marca, iconos SVG, tipos de dominio, contenido completo de los 4 gimnasios y semana base, Dexie, onboarding, HOY con check-in y R1, GYM con registro de series y temporizador (sin R2 aún: sugiere "misma carga que la última vez"), peso con gráfica, calendario semanal estándar (solo lectura), exportar/importar JSON.
**Aceptación:**
- [ ] `pnpm build` produce PWA instalable en iOS; abre offline; check-in funciona offline.
- [ ] Onboarding crea Profile y semana 1; HOY muestra Cantera el lunes 7 sep.
- [ ] Check-in en < 30 s con una mano; PV y estado correctos según R1 (tests con 10 casos, incluidos KO por muñeca 5 y CARGADO por 2 verdes).
- [ ] Registro de un combate completo de Cantera con calentamiento obligatorio, series, descansos y cierre; queda en Dexie y aparece en el historial.
- [ ] Gráfica de peso con media móvil 7 d.
- [ ] Export → borrar todo → import deja el estado idéntico.
- [ ] Tema claro/oscuro; sin texto ilegible en ninguno.
- [ ] Lighthouse PWA ≥ 90, sin errores de consola.

### Etapa II · Motor — "Las reglas del gimnasio"
**Construir:** R2–R9 y R11 con tests; sugerencias de carga con razón; deloads; versiones 45/60/75 por estado; RUTAS y Zona Salvaje con interferencia y sustituciones; Combustible completo; algoritmo calórico; síntomas y transición a sentadilla con barra; Consejo de la Liga con scorecard y generación de la semana siguiente; plantillas de semana (montaña, surf, fatiga, viaje); mínimo viable.
**Aceptación:**
- [ ] Cobertura de tests en `src/domain/rules` ≥ 95 %; cada regla con al menos los casos de ejemplo de este informe (p. ej. press banca 8/8/8/8 → +2,5 kg; 8/8/7/6 → misma carga; deload semana 4).
- [ ] Registrar MTB 120' dura el sábado propone eliminar Z2 viernes (si aún no pasó) y aviso sobre Lower del lunes; aceptar cambia la WeekPlan.
- [ ] Planificar running duro el día antes de Cantera muestra ROJO.
- [ ] Día con Cantera AM + natación PM muestra Combustible ALTA con pre 30–40 g prot + 80–120 g CH.
- [ ] Semana 3 con tendencia +0,05 %/sem propone "+150 a +200 kcal/día"; semana 1–2 no propone nada.
- [ ] Muñeca 3,4,5 en tres check-ins seguidos → aviso nivel 1 y KO en apoyos; Vértigo omite handstand y fondos.
- [ ] Consejo del domingo genera la semana siguiente correcta (ola, deload, plantilla) y un informe Markdown con el scorecard.

### Etapa III · Liga — "Medallas, tests y evolución"
**Construir:** R10; tablero del bloque; medallas con animación; SMART con progreso; Combates de Liga (wizard semanas 4/8/12) y comparación; evolución Forma I→II; Índice de Movimientos con mejores marcas; nivel de entrenador; estadísticas 0–100 en la ficha; informe de 12 semanas; "Pregunta al Rival" (sección 10) tras consentimiento; notificaciones locales (check-in matinal, aductor a los 45 min, descanso entre series) donde iOS lo permita.
**Aceptación:**
- [ ] Con datos de prueba (fixture de 8 semanas incluido en `tests/fixtures`), la Liga muestra medalla Cantera conseguida en la semana 5, Resorte al 60 %, nivel "Entrenador de Liga".
- [ ] Test de semana 4 se guarda y en semana 8 muestra deltas.
- [ ] Evolución solo se ofrece cuando las 4 condiciones se cumplen.
- [ ] Informe de 12 semanas se genera en Markdown y se puede compartir desde iOS (Web Share API) o copiar.
- [ ] "Pregunta al Rival" envía únicamente el contexto descrito en 10.2 y muestra al usuario qué se envía antes de enviar.

### Etapa IV · Mundo visual y app "de verdad"
**Construir:** biblia visual generada (Freepik/Magnific o fal.ai) para avatar en 4 formas, 4 líderes de gimnasio, 4 medallas, 6 tipos, objetos, fondos de Ruta y Zona Salvaje; animaciones (entrar al gimnasio, medalla, evolución, PV); splash y iconos definitivos; opcional Supabase (sync entre dispositivos, con auth por magic link solo para Daniel); opcional exportación semanal a Google Drive; opcional Expo/nativa si se quieren push reales.
**Aceptación:** prueba de 10 segundos (alguien entiende que es un juego de entrenamiento sin explicación); todos los assets originales y con licencia de uso comercial del proveedor; tamaño total de assets < 3 MB (WebP/AVIF, sprites); sin regresión de Lighthouse.

---

## 10. Integración con Claude ("El Rival")

### 10.1 Etapas 1–2: informe pegable
El Consejo de la Liga genera un Markdown con: semana N/12, ola, scorecard con semáforos, peso medio y tendencia, tabla de combates (gimnasio, A1/A2 carga×reps×RIR, energía, síntomas), rutas y Zona Salvaje, sustituciones aplicadas, avisos activos, ajuste calórico propuesto, próximas condiciones de medallas, y las 3 preguntas abiertas de la semana. Daniel lo pega en Claude junto con "Actúa como El Rival según los documentos Performance Trainee" y recibe la semana ajustada. Botón "Copiar informe" + Web Share.

### 10.2 Etapa 3: "Pregunta al Rival" en la app
- Función serverless (Vercel `api/rival.ts`) que llama a la API de Anthropic con `ANTHROPIC_API_KEY` en variables de entorno del servidor. **La clave nunca va en el cliente.**
- Protección: token secreto de la app en `localStorage` fijado por Daniel en Ajustes y comprobado por la función; límite de 30 llamadas/día.
- System prompt: resumen de la Constitución + jerarquía + reglas R1–R11 en prosa + "no diagnosticar; ante dolor persistente, recomendar valoración profesional" + "responde en español, máximo 120 palabras salvo que se pida un plan".
- Contexto enviado: perfil (sin email), últimos 7 check-ins, últimas 6 sesiones resumidas, rutas y aventuras de 14 días, WeekPlan actual, avisos activos y la pregunta. Mostrar al usuario el JSON exacto antes de enviar la primera vez y un interruptor en Ajustes.
- Modelo: el más reciente disponible de la familia Claude en el momento de construir; leerlo de una variable de entorno `RIVAL_MODEL`.

---

## 11. Calidad, pruebas y checklist iOS

- **Tests de dominio:** Vitest, 100 % de las reglas con casos de este informe como tabla de verdad. Fixtures: `semana_estandar`, `semana_mtb_dura`, `muneca_creciente`, `deload_sem4`, `peso_plano_2sem`, `ocho_semanas_completas`.
- **Tests de UI:** Testing Library para check-in, registro de serie y aceptación de sustituciones.
- **Accesibilidad:** contraste AA en ambos temas; controles ≥ 44 px; `prefers-reduced-motion` respetado; foco visible.
- **Rendimiento:** first load < 200 KB JS gzip en etapa 1–3; fuentes con `display=swap`.
- **iOS Safari:** probar añadir a inicio, abrir offline, rotación bloqueada a vertical, `100dvh`, teclado numérico (`inputmode="decimal"`), sin zoom al enfocar (font-size ≥ 16 px en inputs), Web Share API, vibración (`navigator.vibrate` no existe en iOS: degradar en silencio), notificaciones locales solo si la PWA está instalada y el usuario concede permiso.
- **Datos:** export automático semanal a un archivo descargable tras el Consejo (recordatorio), para que nunca se pierdan por limpiar Safari.
- **Sin analítica de terceros. Sin cookies. Sin fuentes o scripts de fuera de Google Fonts y el propio dominio.**

---

## 12. Contenido de `CLAUDE.md`

```markdown
# Liga Híbrida

App PWA (iPhone) que convierte el sistema de entrenamiento de Daniel en un juego de entrenador.
Especificación completa y ÚNICA fuente de verdad: docs/SPEC.md. Léela entera antes de trabajar.
Bitácora: docs/PROGRESO.md · Preguntas para Daniel: docs/PREGUNTAS.md

## Reglas de trabajo
- Trabaja por etapas (SPEC §9). No pases de etapa sin cumplir sus criterios de aceptación y hacer commit.
- src/domain es TypeScript puro sin React ni Dexie. Cada regla (SPEC §7) es una función pura con tests en tests/.
- No inventes reglas de entrenamiento o nutrición. Si algo no está en SPEC §6–7, la UI dice "consulta al entrenador" y lo anotas en docs/PREGUNTAS.md.
- Todo nombre, icono, gráfico y sonido es original. Nada de Pokémon ni otras franquicias.
- Datos de salud: local-first (Dexie), exportables, nunca enviados salvo SPEC §10 con consentimiento.
- UI en español; código, commits y comentarios en inglés.
- Antes de cada commit: pnpm typecheck && pnpm lint && pnpm test.
- Decisiones abiertas: usa el valor por defecto de SPEC §2, marca `// DECISION: Dn` y anótalo en docs/PREGUNTAS.md.

## Comandos
pnpm dev · pnpm build · pnpm preview · pnpm test · pnpm typecheck · pnpm lint

## Stack
Vite + React 18 + TypeScript + Tailwind · Dexie · date-fns · zod · vite-plugin-pwa · Vitest · Vercel
```

---

## 13. Prompt inicial para pegar en Claude Code

```
Lee docs/SPEC.md entero (es el informe "Liga Híbrida — Informe de construcción para Claude Code") y crea CLAUDE.md con el contenido de su sección 12.
Después ejecuta la Etapa I completa (sección 9) siguiendo la estructura de repo de la sección 3, el modelo de la sección 5, el contenido exacto de la sección 6 y la regla R1 de la sección 7.
Al terminar: pasa typecheck, lint y tests; haz commit; escribe docs/PROGRESO.md con lo hecho, lo pendiente y las decisiones que necesitas de Daniel (usa los valores por defecto de la sección 2 mientras tanto); y dime cómo instalar la PWA en un iPhone para probarla.
No avances a la Etapa II hasta que yo lo confirme.
```

---

## Apéndice A · Decisiones abiertas para Daniel (copia a `docs/PREGUNTAS.md`)

1. ¿Nombre "Liga Híbrida" o alternativa?
2. ¿Gimnasios Cantera / Yunque / Resorte / Vértigo o nombres de tu zona (montañas, spots)?
3. ¿Avatar = tú en 4 formas (default) o criatura compañera?
4. ¿Español puro o etiquetas de juego en inglés?
5. ¿Gamificación nivel 2 (default) o más/menos?
6. Peso actual y marcas de partida (press banca, dominada lastrada, fondos lastrados, trap bar, split squat).
7. Ventanas reales AM/PM y días en que la mañana no es posible.
8. ¿Privada (default) o compartible con fisio/amigo más adelante?
9. ¿API de imagen para etapa IV: Freepik + Magnific (recomendado), fal.ai, otra?
10. ¿Contar calorías/macros o sistema visual por porciones?
11. Intolerancias, preferencias y alimentos que no quieres usar.
12. ¿Existe el documento 01 (baseline)? Si no, la app lo genera en Semana 0.

## Apéndice B · Fixture mínima de datos de prueba
Incluir en `tests/fixtures/ocho_semanas.json`: perfil (peso inicial 79,0 kg), 56 check-ins con sueño 7–8,5 h y una racha de muñeca 3→4→5 en la semana 6, 32 sesiones (8 por gimnasio) con progresión de press banca 70→77,5 kg y Bulgarian 16→22 kg por mano, 14 rutas Z2 40–60', 6 aventuras (2 MTB duras, 2 surf, 1 trail, 1 boulder), pesos diarios con tendencia +0,18 %/sem, test de semana 4 y 8. Debe producir: medalla Cantera en semana 5, aviso de muñeca en semana 6, propuesta "+150–200 kcal" en semana 3 y "mantener" en semana 5.

---

*Documento de planificación deportiva y de producto. No es diagnóstico ni tratamiento médico. Ante síntomas persistentes o nuevos, la app y este informe remiten a valoración profesional.*
