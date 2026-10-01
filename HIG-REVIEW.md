# Apple HIG adaptation — 2026-10-01

This is a web adaptation, not an Apple certification or native iOS implementation.

## Applied
- A consistent icon family, optical sizes and stroke weights.
- Clear content surfaces; glass reserved for navigation and controls.
- Shared typography, field borders, spacing, placeholders and disabled/pressed/focus states.
- 44 CSS-pixel minimum button height on mobile/coarse pointers; icon controls also have 44-pixel minimum width. Scaled coupon artwork preserves its output geometry.
- Mobile text inputs use 16px text to avoid focus zoom in Safari.
- Keyboard-operable shared tabs (arrows/Home/End), skip-to-content, table sort announcements and row activation without intercepting nested controls.
- Native modal focus containment, Escape dismissal and restoration to the trigger.
- Shorter entrance animations (300ms, stagger capped at 120ms); repeat-on-scroll retained.
- Reduced motion, reduced transparency, increased contrast and forced-color CSS fallbacks.

## Verification performed
- TypeScript compilation.
- 19 focused render/audience/coupon workflow tests passed.
- Desktop/mobile route layout inventory for home, customers, campaigns, coupons, results, stores, partners, brand, assistant, data, settings and campaign creation; no document-level horizontal overflow in sampled layouts.
- Visual inspection of loaded customer, brand, campaign creation and coupon studio screens, including 390px mobile studio and editor.
- Keyboard tab switching and modal Escape/focus restoration verified in browser.

## Boundaries
Not a full WCAG certification. Physical-device VoiceOver/TalkBack, Windows high-contrast rendering and every combination of imported content have not been verified. Preference fallbacks were reviewed in code, not all exercised in operating-system settings. Coupon artwork is user-authored content and can have its own typography/colors. Existing business logic and paid AI integrations were not revalidated through paid calls during this visual review.

## Primary references
- https://developer.apple.com/design/human-interface-guidelines/materials
- https://developer.apple.com/design/human-interface-guidelines/accessibility
- https://developer.apple.com/design/human-interface-guidelines/buttons
- https://developer.apple.com/design/human-interface-guidelines/layout
- https://developer.apple.com/design/human-interface-guidelines/sf-symbols
