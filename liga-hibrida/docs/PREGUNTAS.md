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

- **Checklist diario de Combustible y tick de creatina.** Se guardan en `localStorage` por fecha (no entran en la exportación JSON). ¿Los pasamos a una tabla Dexie exportable en la Etapa II?
- **Inicio del bloque.** La Semana 0 obliga a elegir un lunes (D13). Si el bloque empieza otro día, ¿qué semana cuenta como 1?
