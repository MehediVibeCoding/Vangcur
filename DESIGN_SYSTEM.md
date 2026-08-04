# Vangcur — Design System

## Brand Colors

Logo-ভিত্তিক, pixel-sample করা exact color (লাল থেকে নীল — স্থায়ী পরিবর্তন):

| Role | Hex | Tailwind token | ব্যবহার |
|------|-----|-----------------|---------|
| Background / Base | `#C3DEFC` | `brand-bg` | `<body>`-তে top-to-bottom gradient হিসেবে ব্যবহার হয় (`brand-bg` → `#DCEBFD` → `white`), solid fill না — Meta Business Suite-এর মতো হালকা fresh sky-blue-to-white আবহ তৈরি করতে |
| Contrast / Primary | `#0058C7` | `brand-primary` | Button, link, heading emphasis, active state (আগে `--red` / `--hover`) |
| Secondary Accent | `#005EFC` | `brand-accent` | Badge, hover highlight, selective touch (আগে `--red2` / `--hover2`) |
| Surface | `#FFFFFF` | `brand-surface` | Card/nav/footer-content সাদা background (আগে `--white`) |

## Neutral Colors (অপরিবর্তিত)

| Role | Hex | Tailwind token |
|------|-----|-----------------|
| Text (dark) | `#1A1A1A` | `ink` |
| Muted text | `#6B7280` | `muted` |
| Light background | `#F3F4F6` | `surface-muted` |
| Border | `#E5E7EB` | `border-base` |
| Gold (offer/badge) | `#D4A853` | `gold` |
| Green (success) | `#10B981` | `success` |
| Info blue (non-brand) | `#3B82F6` | `info` |

## Shadows

| Token | Value |
|-------|-------|
| `shadow-sh1` | `0 1px 4px rgba(0,0,0,.07)` |
| `shadow-sh2` | `0 4px 18px rgba(0,0,0,.10)` |
| `shadow-sh3` | `0 8px 36px rgba(0,0,0,.13)` |

## Radius

| Token | Value |
|-------|-------|
| `rounded-brand` | `12px` (default card/element radius) |
| Nav pill | `35px` (arbitrary `rounded-[35px]`, nav-only) |

## Typography

- Display / logo: `Playfair Display, serif`
- Body / UI: `DM Sans, Hind Siliguri, sans-serif`

Tailwind tokens: `font-display`, `font-body`.

## Breakpoints (legacy-exact)

| Token | Width |
|-------|-------|
| `xs` | 359px |
| `sm2` | 411px |
| `sm` | 480px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1200px |
| `2xl` | 1440px |

## Transition

`transition-brand` → `all .25s cubic-bezier(.4,0,.2,1)` (legacy `--tr`).

## Surface Patterns (body gradient onward)

- **Floating navbar pill**: frosted-glass — `bg-white/70` + `backdrop-blur-md` + `border-white/60` + `shadow-sh2`, instead of solid `brand-surface`, so the body's sky-blue gradient shows through subtly as the page scrolls.
- **Search dropdown / mobile search bar**: same frosted family at higher opacity (`bg-white/95` and `bg-white/85` respectively) — enough blur for cohesion, enough opacity for text readability.
- **Footer**: `bg-gradient-to-b from-ink to-[#0f1a2e]` (matches the dark navy used in the About section, instead of flat `bg-ink`), topped with a 3px horizontal accent line — `bg-gradient-to-r from-brand-bg via-brand-accent to-brand-primary` — that visually threads the light body gradient into the dark footer using the brand's own 3-color ramp.

## Notes

- Spacing, component sizing (button padding, icon sizes, gaps) follow the exact px values from the legacy CSS — converted to Tailwind's arbitrary-value syntax (`w-[42px]`, `gap-[14px]` etc.) per component, not a new spacing scale. Layout/spacing itself doesn't change in Phase 2 — শুধু color scheme বদলাচ্ছে।
- Logo gradient makes `#0058C7`/`#005EFC` a mid-tone approximation. If an exact canonical hex is ever supplied by a designer, update the three brand tokens in `tailwind.config.ts` only — every component reads from those tokens, nothing is hardcoded elsewhere.
