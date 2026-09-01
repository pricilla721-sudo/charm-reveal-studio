# Plan: Convert landing page into the Paperless Order student flow

## Goal
Replace the current marketing-style index page with the functional student order flow from `allrec-paperless-order_18.html`, styled with the existing navy/gold marketing aesthetic.

## What will change

### 1. Page structure
- Drop the marketing-only sections: builder features grid, payment explainer, production timeline, dealer section, and walkthrough CTA.
- Turn the page into a state-driven multi-step wizard that lives at `/`.
- Steps (mirroring the source file):
  1. **Welcome** — hero with school context, starting price, and "Start building" CTA.
  2. **Student details** — name, email, phone, graduation year, activity.
  3. **Package picker** — interactive cards with the "priced by the rep" framing, running total, and "Build your own" option.
  4. **Sizing method** — choose photo / quiz / chart / already measured.
  5. **Sizing inputs** — photo guidance, quiz questions, or chart selection.
  6. **Size result** — recommended size with override.
  7. **Builder** — sleeves, letter/year, patches, monogram/name, placement.
  8. **Review** — order summary, parent/self-pay selection.
  9. **Payment / submit** — card/ACH/wallet or rep-collect flow.
  10. **Confirmation** — order status and production timeline.

### 2. State management
- Use React `useState` for the local wizard state (screen, package, sizing, student info, builder options, payment).
- Keep the data model close to the source file's `state` object so the rendered summary and pricing match.
- Compute line items, subtotal, tax, and total with the same logic as the prototype.

### 3. Package section
- Render the three packages as selectable cards (Essential / Classic / Complete) plus a "Build your own" option.
- Show the selected package, included items, and a sticky running total.
- Keep the "priced by the rep" note but make it a helper caption rather than the section headline.

### 4. Visual design
- Reuse the existing design tokens (`surface-navy`, `text-gold`, card utilities, gradients).
- Use the AllRec house jacket SVG from the source file as the hero/ preview asset.
- Keep typography: Oswald for display, Inter for body.
- Maintain the premium, physical-product feel.

### 5. Assets
- Keep the generated jacket photo for the welcome hero background.
- Reuse the source file's inline SVG jacket previewer for the builder and review screens.
- Remove or repurpose `sizing.jpg` and `patches.jpg` if not used.

### 6. Head metadata
- Update `head()` title/description to reflect the order flow rather than a marketing page.

## Out of scope for this plan
- Backend persistence or payment processing (the source file is a prototype; this stays a frontend demo).
- Full mobile drag-to-turn jacket interaction (will provide front/back toggle instead).
- Real AI measurement (will simulate with guidance and manual override).

## Files to modify
- `src/routes/index.tsx` — main wizard component.
- `src/styles.css` — add any new utility classes needed for wizard chrome (stepper, package cards, price rail).
