# Tailored Products · DOGA Drive Systems

[![Deploy](https://github.com/danielszgen/Tailored-products/actions/workflows/deploy-preview.yml/badge.svg?branch=main)](https://github.com/danielszgen/Tailored-products/actions/workflows/deploy-preview.yml)

> 🔗 **Tailored Products preview:** **<https://danielszgen.github.io/Tailored-products/>**
>
> 📊 **Website Review Dashboard:** **<https://danielszgen.github.io/Tailored-products/#/dashboard>**

Maqueta de la nueva sección **Tailored Products** para la web de **DOGA — Drive Systems Division**, junto con el sistema de motion graphics en Remotion para los videos del producto.

---

## 🧭 Qué hay en este repo

| Carpeta | Qué es |
|---|---|
| [`doga-preview/`](./doga-preview) | App **Vite + React + Tailwind** con la maqueta interactiva del design system DOGA. Lo que se ve en el deploy. |
| [`liga-hibrida/`](./liga-hibrida) | **Liga Híbrida** — PWA (iPhone) que convierte el sistema de entrenamiento en un juego de entrenador. Especificación en `liga-hibrida/docs/SPEC.md`, bitácora en `liga-hibrida/docs/PROGRESO.md`. |
| [`src/`](./src) | Composiciones **Remotion** para videos animados (presenter titles, cinematic titles, subtítulos estilo Instagram, motion graphics de la home). |
| [`public/`](./public) | Assets fuente (videos `.mp4 / .mov`, archivos `.srt`). *No se versionan en Git por tamaño — solicitarlos al equipo.* |
| [`.github/workflows/`](./.github/workflows) | CI que despliega `doga-preview/` a GitHub Pages en cada push a `main`. |

---

## ✨ Sistema de diseño DOGA reflejado en la maqueta

- 🟥 Rojo corporativo `#df1e24` (badges, accents, CTAs primarios)
- 🟦 Azul corporativo `#17355f` (titulares, navegación activa, fondos de tarjeta)
- ⚪ Grises slate y fondos *glass* (`backdrop-blur` + gradientes blancos translúcidos)
- 🅰️ Tipografía **Montserrat** (400 / 500 / 600 / 700 / 800)
- 📐 Bordes redondeados de 20–26 px, sombras suaves, tarjetas con borde fino slate-200

### Bloques implementados en la maqueta

1. **Header** con nav (Products · Markets · Company · Sustainability · Careers) + buscador + Contact us
2. **Hero** "Tailored Products" — tarjeta glass + cuadro hero oscuro con grid pattern y CTA *Play preview*
3. **From requirements to tailored solution** — bloque explicativo + placeholder video render
4. **Acordeón Capabilities** (5 items): Mechanical Design · Electrical / Electromagnetism · Electronics · Software · Cloud / Data
   - Cada uno con tarjetas Management / Design en rojo y azul, listas con bullet rojo, placeholders de imágenes inspiradas en los slides
5. **Acordeón Laboratory & Validation** (3 items): Electrical & Motors Banks · Electronics & Software Validation (con badges CANoe / KVASER) · EMI, Vibrations & Traction
6. **Current applications** — 3 tarjetas azul DOGA (Universal Motor Controller · Precision Wiper Adjustment · Wireless Motor Communication)
7. **Formulario de contacto** con email `doga@doga.es`

---

## 🚀 Visualizar la maqueta

### Opción 1 — Online (recomendado para reviewers)

👉 **<https://danielszgen.github.io/Tailored-products/>**

Cada `git push` a `main` actualiza esta URL automáticamente vía GitHub Actions (~40 s).

### Opción 2 — Local

```bash
git clone https://github.com/danielszgen/Tailored-products.git
cd Tailored-products/doga-preview
npm install
npm run dev
# abre http://localhost:5174
```

Requiere Node.js 20+.

---

## 🎬 Renderizar los videos Remotion

Los videos del producto viven en [`src/`](./src) y se renderizan con Remotion. Las composiciones registradas en [`src/Root.tsx`](./src/Root.tsx) son:

| Composition ID | Para qué sirve |
|---|---|
| `MyComp` | Motion graphics de la home (24 s, 6 escenas) |
| `IGSubtitles` | Subtítulos estilo Instagram con énfasis dramático |
| `SubtitlesOnly` | Versión transparente para exportar a DaVinci |
| `PresenterTitles` | Títulos didácticos a ambos lados del presentador |
| `CinematicTitles` | Títulos editorial italic serif con pop-light glow |
| `CinematicTitlesAvenir` | Variante geométrica con tipografía Avenir |

```bash
npm install
npx remotion studio                                         # editor visual
npx remotion render <id> --image-format=png --sequence \
   --output=out/<id>                                        # PNG sequence para DaVinci
```

---

## 🛠️ Stack técnico

| Capa | Tecnología |
|---|---|
| Maqueta web | Vite 5, React 18, TypeScript, **Tailwind CSS 3**, lucide-react |
| Videos | **Remotion 4**, React, TypeScript |
| Hosting | **GitHub Pages** (deploy automático vía Actions) |
| Tipografía | Montserrat (Google Fonts) · Playfair Display · Avenir Next |

---

## 📬 Workflow para revisión

```bash
git checkout -b feature/<nombre-cambio>
# … editar archivos …
git commit -am "Describe el cambio"
git push -u origin feature/<nombre-cambio>
```

→ Crea un Pull Request desde GitHub. Tras revisión y merge a `main`, la URL pública se actualiza sola.

---

## 📄 Licencia

Privado · DOGA Drive Systems Division — uso interno para validación de diseño.
