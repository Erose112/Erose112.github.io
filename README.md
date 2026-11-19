# Ethan Rose — portfolio

A React 19 + Vite personal site. Live at [erose112.github.io](https://erose112.github.io/) (`vite` `base: '/'` — not `/portfolio-website/`). Legacy project-page URLs should use the redirect HTML under [`deploy/`](deploy/).

Portfolio content loads on `#plain` by default (Source Serif 4 body). **ENTER WORLD** opens the Chrome offline dinosaur desert with About / Experience / Projects portals, or a side-scrolling **Dino Run** mini-game. In the desert, **PORTFOLIO** returns to the plain view; Experience and Projects can also open as dialogs from the plain page and return there.

| Mode | Hash |
| --- | --- |
| Plain page (default) | `#plain` |
| Desert overworld | `#world` |
| Sections | `#about`, `#experience`, `#projects` |
| Dino Run | `#dino-run` |

Sprites, sounds, and Chromium reference excerpts are credited on the plain-page footer and in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Build notes live under [`docs/`](docs/).

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm test` — Node unit tests (runner fairness / scoring)
- `npm run lint` — ESLint
- `npm run preview` — preview the production build
