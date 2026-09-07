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
