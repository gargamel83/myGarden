# Specifications — MonJardin

Web application for managing a vegetable garden.

## Technical Stack
- **Frontend/Backend** : SvelteKit (TypeScript)
- **Database** : SQLite via Drizzle ORM
- **CSS** : Tailwind CSS
- **Interactive map** : Leaflet (OSM)
- **Polygon drawing** : Canvas/SVG
- **Authentication** : Single-user, password in `.env`
- **Deployment** : Docker

---

## Modules

### 1. Garden Organization
- Upload a satellite photo (or garden plan)
- Draw polygons (cultivation beds) on the image
- Each bed has: name, dimensions, orientation, soil type
- Alternatively: select a plot via OSM map (Leaflet)
- Garden overview with beds

### 2. Planting Management
- CRUD plantings linked to a bed
- Cycles: sowing → transplanting → harvesting (dates, statuses)
- Calendar / timeline of operations
- Per-bed history (rotation visible)

### 3. Plant Knowledge Base
- Pre-filled sheets (58 vegetables, herbs, and edible flowers)
- Fields: sowing/transplanting/harvesting period, exposure, soil, climate, planting distance, companion planting
- Photo gallery (diseases, growth stages)
- Individualized advice based on the bed (soil, exposure)
- Search and filters

### 4. Crop Rotation
- Rotation suggestions based on bed history
- Botanical families, previous crops
- Alerts if a rotation is too short

### 5. Dashboard / Monitoring
- Seasonal overview
- Alerts: rotation, active plantings

---

## Development Environment

### Session 1 (Iteration 1 — v0.0.1)
- **Date** : June 9, 2026
- **Agent** : opencode CLI (AI-assisted coding tool)
- **Model** : big-pickle (opencode/big-pickle)
- **OS** : Linux
- **Shell** : zsh

### Session 2 (Iteration 2 — v0.1.0)
- **Date** : June 10, 2026
- **Estimated time** : ~4h
- **Total tokens consumed** : ~40,000 (tiktoken gpt-4 estimate)
  - Source files: ~31,900 tokens
  - Scripts/config: ~500 tokens
  - Conversation prompts/responses: ~8,000 tokens
- **Branch** : `iteration-2`
- **Commits** : 1 (not committed at the time of writing)

### Tools available to the agent
- `read` / `write` / `edit` — file manipulation
- `glob` — file pattern search
- `grep` — content search in files
- `bash` — shell command execution
- `task` — subtask delegation to sub-agents
- `websearch` / `webfetch` — web search and info retrieval
- `question` — ask questions to the user
- `todowrite` — structured task tracking

### Active rules
- Always re-read the file before editing it
- Use `npm run build` after modification to verify compilation
- DB schema: modify → `npx drizzle-kit generate` → `npx drizzle-kit push`
- Commits only on explicit request
- No proactive documentation (`.md`) unless requested
- Language: French with the user (who speaks French)
- Concise, response < 4 lines unless detail requested
- Always use imports from `$lib/types` for shared types (PlantStatus, etc.)

### Dependencies / versions (as of June 10, 2026)
```json
{
  "svelte": "^5.56",
  "@sveltejs/kit": "^2.63",
  "drizzle-orm": "^0.45",
  "better-sqlite3": "^12.10",
  "tailwindcss": "^4.3",
  "leaflet": "^1.9",
  "drizzle-kit": "^0.31",
  "tiktoken": "^1.0"
}
```
- Runtime: Node.js (host system version)
- Database: single SQLite file `data/monjardin.db`

### Iteration 2 — Delivered Features

| # | Feature | Modified Files |
|---|---------|-------------------|
| 1 | No more full page reload after CRUD — replaced `fetch() + window.location.reload()` with `<form> + use:enhance + invalidate()` on all pages | garden, plantations, plants, login |
| 2 | Form validation — `required` fields, server error display (`fail()`) via toasts | garden, plantations, plants |
| 3 | Personalized bed advice — `getBedAdvice()` filters compatible plants based on bed soil and exposure, displayed in the edit modal | `rotation.ts`, `garden/+page.server.ts`, `garden/+page.svelte` |
| 4 | Dashboard statistics — total cultivated area, top 5 crops (proportional bars), monthly occupancy (histogram) | `+page.server.ts`, `+page.svelte` |
| 5 | Improved calendar — bed filter, month navigation (◀/▶/Today), detailed tooltips, current month highlighting | `plantations/+page.svelte` |
| 6 | Photo lightbox — reusable component with keyboard navigation (←/→/Esc), counter, dark overlay | `Lightbox.svelte` (created), `plants/[id]/+page.svelte` |
| 8 | Accessibility — Escape to close modals, `role="dialog"` + `aria-modal`, removed `svelte-ignore a11y_*` | garden, plantations, plants |
| 9 | Strict TypeScript — union types (`PlantStatus`, `SunExposure`, etc.) in `$lib/types.ts`, removed `as any` in garden, centralized labels/statuses | `types.ts` (created), garden, dashboard, plantations |

| 10 | Logger integration — imported in hooks, logs all requests (method, path, status, ms) | `hooks.server.ts`, `login/+page.server.ts`, `logger.ts` |
| 11 | FK deletion fix — `deleteBed` returns friendly error message instead of crash | `garden/+page.server.ts` |
| 12 | Full English translation — all UI text, comments, error messages, and documentation | All files |
| 13 | A11y warnings fixed — `tabindex`, `e.target === e.currentTarget` pattern, `onkeydown` on forms | garden, plantations, plants |

### Technical Notes
- `event.depends()` added in all `load` functions to enable targeted `invalidate()`
- Dependency keys: `app:garden`, `app:plantations`, `app:plants`, `app:plant`, `app:dashboard`
- `use:enhance` used with callbacks for modal close + toast + `invalidate()`
- Companions/antagonists conversion (csv → JSON) happens in the `use:enhance` callback via `formData.set()`
- No DB schema modification (no migration generated)
- Logger writes to stdout AND `/app/data/logs/app.log` (in Docker) or `/app/data/logs/error.log` for errors
- Modal close pattern: `e.target === e.currentTarget` check (no `stopPropagation` on inner div), `role="none"` on inner containers
