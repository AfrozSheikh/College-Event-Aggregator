# College Events – Frontend Design Guide

**Direction: "the campus noticeboard".** The UI should feel like something a thoughtful student designer made by
hand for their own college – printed-matter warmth, editorial typography, restraint. It must NOT look like an
AI-generated SaaS template.

Stack: React 19 + Vite + Tailwind v4 + shadcn/ui (Radix) + lucide-react + sonner. Path alias `@/` → `src/`.

## The look
- **Paper & ink.** Warm off-white background (`bg-background`), cards slightly lighter (`bg-card`), ink text
  (`text-foreground`), warm greys (`text-muted-foreground`). Dark mode is warm charcoal. Always use tokens:
  `bg-background bg-card bg-muted bg-accent text-foreground text-muted-foreground border text-primary
  text-success text-destructive bg-warning/20`.
- **One accent colour: brick red** (`primary`). Use it for *the* main action on a screen, active states, and the
  occasional emphasised word. Most buttons are ink (`Button` default) or `outline`/`ghost`.
- **Marigold highlighter** (`.marker` utility) — a hand-drawn highlight behind 1–3 words, at most once per screen.
- **Type.** Headings are **Fraunces** (serif, automatically on h1–h3; use `font-serif` elsewhere). Body is
  Public Sans. Small metadata (dates, counts, IDs, file sizes, section labels) uses the `.meta` utility (IBM Plex
  Mono, 11.5px, muted). Use *italic serif* (`<em>` inside a heading or `font-serif italic`) for a touch of voice.
  Big numbers: `font-serif text-4xl tabular`.
- **Shapes.** Small radii (`rounded-md` / `rounded-lg` max). Hairline borders instead of shadows. Separate sections
  with whitespace and `border-t`/`border-b` rules rather than boxing everything in cards.
- **Layout.** Editorial, asymmetric where it helps: e.g. a wide main column + narrow side column; lists as ruled rows
  (`divide-y`) rather than grids of identical boxes. Generous whitespace. Content max width is set by Layout.
- **Category colour** comes from `getCategoryStyle(category)` → `{ label, dot, text, badge, poster }` (muted print
  colours). Show category as a small coloured dot + label (`cat.dot`, `cat.text`) or `Badge className={cat.badge}`.
  Image-less covers use `cat.poster` (solid colour) with the label in large italic serif, white.

## Hard bans (these are the "AI-generated" tells we are removing)
- ❌ Gradients of any kind on backgrounds, text, buttons, icons or borders (`bg-gradient-*`, `from-*`, `via-*`, `to-*`,
  `bg-clip-text`). The only allowed gradient is a black→transparent scrim over a photo for legible caption text.
- ❌ Icons inside coloured/gradient rounded squares or circles ("icon tiles"). Icons, when used, are small (size-4),
  inline with text, `strokeWidth={1.75}`, muted. Many places need no icon at all.
- ❌ Dark "hero banner" cards with glows/spotlights/blobs/grids. ❌ `Spotlight`, `Meteors`, `AuroraBackground`,
  `BackgroundGradient`, `SpotlightCard`, `MovingBorderButton`, `TextGenerateEffect`, `FlipWords`, 3D cards —
  remove these imports entirely (they're retired no-ops now).
- ❌ Emoji in UI (badges, headings, toasts, empty states, "👋").
- ❌ Glassmorphism / `backdrop-blur`, glow shadows (`shadow-*-500/30`), `shadow-xl` on cards, `rounded-2xl/3xl`.
- ❌ Uppercase letter-spaced eyebrow labels everywhere (`tracking-widest uppercase`). Use `.meta` (sentence case) sparingly.
- ❌ Rainbow sets of 4–5 coloured stat tiles. Show figures as a ruled row (`StatRow` + `StatCard`).
- ❌ Hover lift + glow + scale on everything; bouncy springs; staggered animations on every list. Motion should be
  barely noticeable: a quick fade on page sections is enough.
- ❌ Marketing / template copy: "Jump right back into what matters", "Grab a spot before seats run out",
  "Elevate…", "Seamless…", "Unlock…", "Your journey…", "All caught up 🎉". ❌ Fake stats, fake testimonials, invented
  numbers. ❌ Title Case For Every Heading.

## Copy voice
Plain, specific, a little warm – like a helpful senior writing the noticeboard. Sentence case everywhere.
Prefer concrete words ("3 events this week", "Registrations close when seats run out") over hype. Short labels:
"New event", "Register", "Edit", "Delete", "Download PDF". Greetings: "Evening, Afroz." not "Good evening, Afroz! 👋".
Empty states say what's empty and what to do next, in one sentence.

## Never change behaviour
Keep every API call (URL, method, payload, headers), state variable, validation, navigation target, role check,
toast trigger and FormData key. Only markup/styling/copy changes. Copy changes must not change meaning of warnings
or instructions (e.g. payment rules).

## Building blocks
### shadcn/ui – `@/components/ui/*`
- `button` → `Button` variants: `default` (ink), `accent` (brick, the main CTA; `gradient` is an alias – prefer
  `accent`), `outline`, `ghost`, `secondary`, `destructive`, `success`, `link`; sizes `sm, default, lg, icon, icon-sm`;
  props `asChild` (wrap `<Link>`), `loading`.
- `card` (`Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter`) – use for forms and
  genuinely grouped content, not for every section.
- `input`, `textarea`, `label`, `select` (`SelectItem value` cannot be ""), `tabs` (underline style),
  `dialog`, `alert-dialog`, `sheet`, `popover`, `dropdown-menu`, `tooltip`, `table`, `badge`
  (variants: default, secondary, outline, success, warning, destructive, info, soft),
  `misc` → `Skeleton, Separator, Progress, Avatar, AvatarFallback, Checkbox, Switch`.

### App components – `@/components/common/*`
- `PageHeader` – `<PageHeader eyebrow="…" title="…" description="…" actions={…} />` (serif title + rule; no icon)
- `StatCard` + `StatRow` – `import StatCard, { StatRow } from '@/components/common/StatCard'`;
  `<StatRow><StatCard label value hint tone="accent"? onClick? /></StatRow>`
- `EventCard` – ticket-style event card: `<EventCard event actions compact? badge? />`
- `EmptyState`, `Loaders` (`FullPageLoader, PageSkeleton, ListSkeleton`), `ConfirmDialog`, `FileDropzone`,
  `ImageLightbox`, `motion` (`FadeIn, Stagger, StaggerItem` – subtle), `ThemeToggle`,
  `Brand` (default wordmark with pennant; also exports `Pennant`).
- `@/components/aceternity/focus-cards` → `FocusCards` is now a calm photo grid and may still be used.

### Utilities – `@/lib/utils`
`cn, API_URL, fileUrl(path), getInitials, formatDate, formatTime, formatLongDate(date?) ("Saturday, 8 November"),
timeOfDay() ("Morning"|"Afternoon"|"Evening"), getCategoryStyle, CATEGORY_STYLES`.
CSS utilities: `.meta`, `.marker`, `.perforated` (dashed tear line), `.tabular`, `.scrollbar-none`.

## Checks before you finish
- `grep` your files for `gradient`, `from-`, `via-`, `bg-clip-text`, `backdrop-blur`, `shadow-xl`, `shadow-lg`,
  `rounded-2xl`, `rounded-3xl`, `tracking-widest`, `Spotlight`, `Meteors`, `Sparkles`, emoji — there should be none
  (except a photo scrim).
- `npx eslint <your files>` – fix errors you introduced (existing `exhaustive-deps` warnings are OK).
- `npx vite build` must pass. Do NOT run `npm install`.
