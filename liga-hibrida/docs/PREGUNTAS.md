# Preguntas y decisiones pendientes para Daniel

Mientras no haya respuesta, la app usa el valor por defecto de SPEC §2 y el código lo marca con `// DECISION: Dn`.

## Decisiones abiertas (SPEC Apéndice A)

1. ¿Nombre "Liga Híbrida" o alternativa? — _Default D1: Liga Híbrida._
2. ¿Gimnasios Cantera / Yunque / Resorte / Vértigo o nombres de tu zona (montañas, spots)? — _Default D2._
3. ¿Avatar = tú en 4 formas (default) o criatura compañera? — _Default D3: el propio entrenador, sin criatura (siluetas SVG en `src/brand/icons/FormSilhouette.tsx`)._
4. ¿Español puro o etiquetas de juego en inglés? — _Default D4: español con siglas cortas (PV, RIR, Z2)._
5. ¿Gamificación nivel 2 (default) o más/menos? — _Default D5: sin sonidos, sin XP por serie; el temporizador vibra si el dispositivo lo permite (en iOS no)._
6. Peso actual y marcas de partida (press banca, dominada lastrada, fondos lastrados, trap bar, split squat). — _Se piden en la Semana 0; fondos +20 kg precargado como referencia._
7. Ventanas reales AM/PM y días en que la mañana no es posible. — _Default D7: 07:00–09:00 y 19:00–21:00, editables en Ajustes._
8. ¿Privada (default) o compartible con fisio/amigo más adelante? — _Default D8: privada._
9. ¿API de imagen para etapa IV: Freepik + Magnific (recomendado), fal.ai, otra? — _Default D9: SVG propio hasta etapa IV._
10. ¿Contar calorías/macros o sistema visual por porciones? — _Se pregunta en la Semana 0; default "porciones"._
11. Intolerancias, preferencias y alimentos que no quieres usar. — _Campo libre en la Semana 0._
12. ¿Existe el documento 01 (baseline)? Si no, la app lo genera en Semana 0. — _Asumido: no existe; la Semana 0 recoge baselines._

## Preguntas surgidas durante la Etapa I

### Producto y repo

- **Ubicación en el repo.** `Tailored-products` ya alojaba un proyecto Remotion (raíz) y `doga-preview/`. Para no pisar el `CLAUDE.md` de Remotion, Liga Híbrida vive en `liga-hibrida/` con su propio `CLAUDE.md`, `docs/` y `package.json`. ¿Prefieres moverla a un repositorio propio?
- **Despliegue.** No hay acceso a Vercel desde esta sesión. El proyecto incluye `vercel.json` listo para importar el repo con "Root Directory = liga-hibrida". Alternativa: publicar también en GitHub Pages bajo `/Tailored-products/liga-hibrida/` (habría que modificar el workflow existente y la `base` de Vite). ¿Cuál prefieres?
- **Fuentes.** Titan One, Nunito y Silkscreen se cargan desde Google Fonts con fallback local; el service worker las cachea tras la primera carga con conexión. ¿Quieres empaquetarlas en el repo (licencia OFL lo permite) para que la primera carga sea 100 % offline?
- **Tokens y contraste AA.** SPEC §4.2 fija `ink3` claro = #7C879B y `accent` claro = #E23D4A, pero SPEC §11 exige contraste AA en ambos temas y Lighthouse los marca (3,3:1 y 4,2:1). Se han oscurecido mínimamente en el tema claro (`ink3` → #63708A, `accent` → #DA3541) y en el tema oscuro los botones usan texto oscuro sobre el rojo (#FF5462 con blanco solo da 3:1). ¿Aceptas estos valores o prefieres otros que cumplan AA?
- **Lighthouse PWA.** Lighthouse ≥ 12 eliminó la categoría "PWA", así que el criterio "Lighthouse PWA ≥ 90" no se puede medir literalmente. Se verifica la instalabilidad (manifest, service worker, offline) con un recorrido automatizado en Chromium y se reportan las categorías que sí existen. ¿Vale como sustituto?

### Reglas (SPEC §7)

- **R1 · KO por tendencia creciente con valores bajos.** SPEC §7 R1 marca KO "si el síntoma ha subido en 3 check-ins seguidos". Se aplica literalmente, así que 0 → 1 → 2 también da KO. ¿Quieres un umbral mínimo (p. ej. solo si el último valor ≥ 3)?
- **R1 · "Persiste 3 registros" en KO por aductor.** Se interpreta como 3 check-ins consecutivos (registros, no días naturales) con aductor ≥ 5 para mostrar el mensaje de valoración profesional. ¿Debe romper la racha un día sin check-in?
- **R1 · KO por "≤ 1 verde" sin dolor.** Un día con sueño corto, energía baja y piernas cansadas (sin dolor) también da KO y reduce la sesión a técnica suave. ¿Correcto o debería ser CARGADO?
- **Main lifts vs accesorios.** Para "−1 serie en accesorios" (CARGADO) se consideran principales los slots A1/A2 y B1/B2 (los del "registro mínimo"); el resto son accesorios. ¿Es esa la intención del documento 05?

### Contenido (SPEC §6)

- **Plantilla "Fatiga / trabajo".** El documento lista los ingredientes sin días; se ha mapeado L Cantera 45' · M Yunque · X yoga · J Resorte 45' · V Vértigo (o OFF) · S ruta fácil opcional · D OFF. ¿Coincide?
- **Plantilla "Viaje".** Los "2 full-body de mantenimiento" no están definidos en el documento 05: se muestran como nota ("consulta al entrenador"). ¿Quieres definirlos?
- **Miércoles PM "escalada o skate técnico".** Se planifica como "deporte técnico · escalada" (RPE ≤ 6); skate queda para la plantilla surf/skate. ¿Correcto?
- **Combustible del martes.** La tabla dice "MEDIA-ALTA (doble → ALTA)". En Etapa I se muestra MEDIA-ALTA; el ajuste automático a ALTA cuando se hace la doble llega con R6 (Etapa II).

### Datos

- **Checklist diario de Combustible y tick de creatina.** Se guardan en `localStorage` por fecha (no entran en la exportación JSON). ¿Los pasamos a una tabla Dexie exportable en la Etapa III?
- **Inicio del bloque.** La Semana 0 obliga a elegir un lunes (D13). Si el bloque empieza otro día, ¿qué semana cuenta como 1?

## Preguntas surgidas durante la Etapa II

Cada punto es una interpretación que la app aplica hoy; el código la marca con el comentario de la regla. Si prefieres otra lectura, se cambia en la función pura correspondiente y en su test.

### R2 · Doble progresión (`progression.ts`)

- **Incremento de carga.** "carga + loadStepKg (o +2,5–5 %, el mayor)" se aplica como el mayor entre el paso del ejercicio y el 2,5 % de la carga, redondeado al paso (press banca 70 → +2,5; trap bar 300 → +10). ¿Querías usar el 5 % en algún caso?
- **"Todas las series alcanzaron repMax".** Solo cuenta si además se registraron todas las series planificadas (4 de 4; en CARGADO los accesorios esperan una menos). Una sesión con 3 de 4 series a tope mantiene la carga. ¿Correcto?
- **Objetivo RIR de un rango.** Para "3→2" el objetivo de trabajo es 2 y para "1–2" es 1 (el límite inferior). La comprobación "rir ≥ rirTarget" usa ese valor.
- **Bloqueo por RIR bajo.** "RIR real por debajo del objetivo 2 sesiones seguidas" se evalúa con el RIR mínimo de cada sesión.
- **Descarga y accesorios.** R2 dice "series × 0,65 (mín. 2)" y R3 "accesorios × 0,5". Se aplica ×0,65 (mín. 2) a los principales y ×0,5 (mín. 1) a los accesorios.
- **Ejercicios sin carga** (hanging knee raise / dead bug, paso 0): nunca se propone subir; se pide completar el rango con control.

### R3 · Descargas (`deload.ts`)

- **Z2 −25/−35 %.** El rango planificado se reduce: límite inferior × 0,65 y superior × 0,75, redondeado a 5' (45–55' → 30–40'). La aventura de la semana de descarga lleva la nota "solo fácil".

### R4 · Interferencia (`interference.ts`)

- **Pares fuera de la tabla de §6.7** (interpretados con las reglas 1, 2 y 5): Lower + ruta media (RPE 7) → ÁMBAR; Lower + aventura moderada → ÁMBAR; Lower + surf/escalada dura → ÁMBAR (carga media torso+piernas); Lower + skate → ÁMBAR (si hay saltos, no es recuperación); Lower + MTB/trail/skate dura → ROJO; dos aventuras duras el mismo día → ROJO; running duro solo → ÁMBAR (running conservador). ¿Alguno debería ser otro color?
- **Desnivel.** "Sin intervalos ni desnivel fuerte en las 24 h previas a Lower" se aplica por esfuerzo (ruta `duro` o aventura `dura`); el desnivel registrado no tiene umbral propio. ¿Quieres uno (p. ej. ≥ 500 m+)?
- **Escalada técnica del miércoles** se considera "no dura" (RPE ≤ 6); la escalada dura solo llega como Zona Salvaje (`climb_outdoor`/`boulder` dura).

### R5 · Sustitución (`substitution.ts`)

- **Qué sustituye cada aventura**: MTB → Z2 del viernes y la casilla de Zona Salvaje; trail → rutas de carrera Z2 pendientes; surf → natación pendiente (suave, ruta o técnica); escalada/boulder → deporte del miércoles + nota "reduce tirón/antebrazo" en Vértigo (solo si es dura); skate → deporte del miércoles o Z2 opcional; natación técnica → Z2 opcional; otro → "consulta al entrenador". Solo días desde hoy en adelante; el Lower nunca se toca.
- **Regla 4 "el sábado manda".** Con aventura `dura`: se elimina el PM del viernes (si no pasó) y el domingo pasa a descanso total (OFF). Si la aventura cae en otro día, la casilla de Zona Salvaje planificada pasa a yoga/movilidad ("nunca añadir: intercambiar").
- **Aviso del Lower del lunes** (aventura dura ≥ 90'): se muestra como aviso en HOY el lunes; no modifica la semana siguiente. "Reduce carrera esa semana si piernas cargadas" (MTB) también es solo aviso.

### R6 · Combustible (`fuel.ts`)

- **Zona Salvaje < 90'** no está en la tabla de 03: se trata como ALTA con nota. **Ruta o deporte técnico solos** tampoco: se asume MEDIA con nota. ¿Correcto?
- **Upper + Z2** planificado = MEDIA-ALTA y pasa a ALTA cuando se registran las dos sesiones ("doble → ALTA").
- **Domingo** (yoga suave + paseo) conserva el MEDIA-BAJA de la tabla de §6.4 aunque R6 diría MEDIA para yoga.

### R7 · Peso y calorías (`weight.ts`)

- **Bandas.** "Peso estable" = |tendencia| < 0,05 %/sem; "sube < 0,10" = 0,05–0,10; zona objetivo 0,10–0,25; **0,25–0,35 no está en la tabla**: se propone "mantener y vigilar cintura"; > 0,35 → "−150 a −200 kcal/día (solo si la cintura acelera)" porque la cintura aún no se registra en la app.
- **Pierde peso** = tendencia < −0,05 %/sem: "añade comida" o, si está agotado (PV medio de 7 días < 60 o ≥ 2 KO), "revisa carga + energía…". **Rendimiento cae** = 2 de las 3 últimas sesiones "pesado".
- **Ventana.** Cada evaluación (cada 14 días desde el inicio, la primera el lunes de la semana 3) compara los 7 días anteriores con los 7 previos; hacen falta ≥ 2 pesos por semana.

### R8 · Síntomas (`symptoms.ts`)

- **Persistente ≥ 4 durante 7 días** = todos los registros de los últimos 7 días ≥ 4 con al menos 3 registros. El aviso exige pulsar "Leído" (acuse en `localStorage`, por dispositivo).
- **Transición a sentadilla con barra**: aductor después ≤ 2 en todas las sesiones de Cantera de las 3 últimas semanas con Cantera (y ese dato registrado). Se ha añadido la ficha `high_bar_squat` 4×5–8 RIR 3→2 (el documento dice "3–4×5–8"); Daniel la activa desde GYM y puede volver; si el aductor después supera 2 con la barra, HOY avisa para regresar.

### R9 · Mínimo viable (`minimum.ts`)

- **Prioridades A/B/C**: gimnasios = A; primera ruta Z2 no opcional = A; primera yoga/movilidad = A; segunda ruta = B; natación suave y deporte técnico = B; **ítems opcionales y la Zona Salvaje = C** ("solo si todo está verde"). ¿La aventura debería ser B (rule 8, diversión sostenible) y quedar como "aventura fácil"?
- El paso 4 propone OFF para todas las anclas restantes de la semana. El disparador por estado cuenta check-ins CARGADO/KO de la semana en curso (3 o más).

### R11 · Consejo de la Liga (`council.ts`)

- **Semáforos del scorecard**: Z2 verde con ≥ 1 ruta Z2 (el "+1" es complemento); aventura ámbar si 0 (nunca rojo); sueño verde ≥ 7,5 h, ámbar ≥ 6,5 h; peso verde 0,10–0,25 %/sem, rojo < −0,05 o > 0,40; dolor rojo si creciente/persistente, ámbar si algún registro ≥ 4. Adherencia = anclas hechas / 6.
- El Consejo evalúa la semana en curso (la que contiene el día de hoy) y **sobrescribe** la semana siguiente si ya existía. El informe se guarda como `Adjustment{kind:'plan'}` para poder reabrirlo.
- Las 3 preguntas abiertas se sugieren desde las métricas en ámbar/rojo y los avisos; Daniel las edita.

### Datos y UI

- Registro de sesiones regen (nuevo) en la tabla `regen`; contadores contra el mínimo semanal de §6.6 (aductor: 2/semana como objetivo del contador, "2–3" en el texto).
- La copia JSON semanal tras el Consejo es un botón de descarga (no automática): iOS no permite descargas silenciosas desde una PWA.
