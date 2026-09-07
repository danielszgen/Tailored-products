# Preguntas y decisiones pendientes para Daniel

Mientras no haya respuesta, la app usa el valor por defecto de SPEC §2 y el código lo marca con `// DECISION: Dn`.

## Decisiones abiertas (SPEC Apéndice A)

1. ¿Nombre "Liga Híbrida" o alternativa? — _Default D1: Liga Híbrida._
2. ¿Gimnasios Cantera / Yunque / Resorte / Vértigo o nombres de tu zona (montañas, spots)? — _Default D2._
3. ¿Avatar = tú en 4 formas (default) o criatura compañera? — _Default D3: el propio entrenador, sin criatura._
4. ¿Español puro o etiquetas de juego en inglés? — _Default D4: español con siglas cortas (PV, RIR, Z2)._
5. ¿Gamificación nivel 2 (default) o más/menos? — _Default D5._
6. Peso actual y marcas de partida (press banca, dominada lastrada, fondos lastrados, trap bar, split squat). — _Default D6: vacío; fondos +20 kg precargado como referencia._
7. Ventanas reales AM/PM y días en que la mañana no es posible. — _Default D7: 07:00–09:00 y 19:00–21:00._
8. ¿Privada (default) o compartible con fisio/amigo más adelante? — _Default D8: privada._
9. ¿API de imagen para etapa IV: Freepik + Magnific (recomendado), fal.ai, otra? — _Default D9: SVG propio hasta etapa IV._
10. ¿Contar calorías/macros o sistema visual por porciones? — _Se pregunta en la Semana 0; default "porciones"._
11. Intolerancias, preferencias y alimentos que no quieres usar. — _Campo libre en la Semana 0._
12. ¿Existe el documento 01 (baseline)? Si no, la app lo genera en Semana 0. — _Asumido: no existe; la Semana 0 recoge baselines._

## Preguntas surgidas durante la Etapa I

- **Ubicación en el repo.** El repositorio `Tailored-products` ya alojaba un proyecto Remotion (raíz) y `doga-preview/`. Para no pisar el `CLAUDE.md` de Remotion, Liga Híbrida vive en `liga-hibrida/` con su propio `CLAUDE.md`, `docs/` y `package.json`. ¿Prefieres moverla a un repositorio propio?
- **R1 · KO por tendencia creciente con valores bajos.** SPEC §7 R1 marca KO "si el síntoma ha subido en 3 check-ins seguidos". Se aplica literalmente, así que 0 → 1 → 2 también da KO. ¿Quieres un umbral mínimo (p. ej. solo si el último valor ≥ 3)? Hasta entonces se aplica tal cual está escrito.
- **R1 · "Persiste 3 registros" en KO por aductor.** Se interpreta como 3 check-ins consecutivos con aductor ≥ 5 (o tendencia creciente) para mostrar el mensaje de valoración profesional. ¿Correcto?
- **Fuentes.** Titan One, Nunito y Silkscreen se cargan desde Google Fonts con fallback local; sin conexión se usa el fallback hasta que el service worker las tenga cacheadas. ¿Quieres empaquetarlas en el repo (licencia OFL lo permite)?
- **Despliegue.** No hay acceso a Vercel desde esta sesión. El proyecto incluye `vercel.json` listo para importar el repo con "Root Directory = liga-hibrida". Alternativa: publicar también en GitHub Pages bajo `/Tailored-products/liga-hibrida/` modificando el workflow existente. ¿Cuál prefieres?
