# SENDER-WEB · Rediseño scroll-driven (repo nuevo, desde la conversación completa)

Web final de Sender (BIS SpA) construida de nuevo con los criterios pedidos:
paleta oficial (#ffffff / #1e73be / #494949 / #0085b2), información real de sender.cl,
fotos y videos reales del cliente, ES/EN completo, scroll-driven film (método ScrollCraft),
capítulos editoriales claros alternados con capítulos cinematográficos oscuros.

- `index.html` — página única por capítulos (01 Trayectoria → 07 Contacto)
- `base.css` — sistema de componentes (nav píldora, velo de capítulo, portada catálogo, knob, espectro, htrack)
- `styles.css` — capa de rediseño "Editorial Film" (capítulos papel, tipografía, acentos)
- `app.js` — interacciones: film scrub con lerp, knob de sintonía, osciloscopio, track horizontal, i18n
- `i18n.js` — diccionario ES/EN (198 claves, copy real)
- `assets/` — fotos reales, 16 vistas únicas de stacks, videos (cine/hero-cut/cta-loop/prop-rapanui), fuentes self-hosted

CI: `.github/workflows/audit.yml` (html-validate + Lighthouse CI estático).
Deploy: GitHub Pages desde la raíz de `main` (auto en cada push).
