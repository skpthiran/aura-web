# Aura — Agent Rules

## Code Standards
- TypeScript strict mode: all props and return types must be explicitly typed
- Functional components only — no class components
- All API inputs must be validated with Zod before processing
- Never use `any` type — use `unknown` and narrow with type guards

## File Structure
- All Supabase queries go in src/lib/db/ — never query Supabase directly from components
- All types go in src/types/index.ts
- All constants go in src/lib/constants.ts

## Security Rules
- Never expose service role key — only anon key in frontend
- All database access must go through RLS policies — never bypass
- Validate all user inputs on both client and server side

## Styling Rules
- Use existing design system from index.css — colors: void, deep, obsidian, card, gold, gold-pale, crimson, crimson-bright, marble
- Use existing utility classes: glass-panel, micro-caps, hairline-all, hairline-b, hairline-t, text-shadow-glow
- Motion library for all animations — no CSS keyframe animations for interactive elements
- Mobile-first — every component must work on 375px width
