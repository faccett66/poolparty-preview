# Design lock — sold blue→purple washes

**Locked:** 2026-09-18 (ET)  
**Identity:** Soft blue→purple prestige washes sitewide (Home + inner pages), matching what Frank sold — especially the Advertise Here streaming banner. NOT Soft Miami Electric yellow→cyan / pink chrome.

## Intent

- Body shell: blue→violet radial orbs + lavender→periwinkle linear wash (`#e4ecfc` → `#c0b4e8` family).
- `.ad-stream`: SEC Hear-craft blue→purple wash
  `linear-gradient(145deg, rgba(90,140,220,.42) → rgba(122,59,255,.36))` over soft blue/lavender base; dark ink type; violet `#7a3bff` pulse accents.
- Nav / proto-banner chrome: blue→purple gradient (`#b8d0f5` → `#7a3bff`), not yellow/pink Electric.
- Accents: cyan-blue + violet/purple; **coral CTAs** (Book Now / sticky / primary).
- Keep: current logo (no redesign), hero **Sun’s out** / coral Book Now (hero-rebuild), music.js soft-nav/stop behavior.

## Locked files (this folder)

| File | Role |
|------|------|
| `miami-home-v25.css` | Site shell, header, ad-stream, section bands |
| `pp-tokens.css` | Token bridge + last-wins chrome lock + ad-stream override |
| `hero-rebuild.css` | Hero Sun’s out / coral Book Now (do not garble) |
| `music-layer.css` | Soundtrack dock layer |

## DO NOT change without Frank unlocking

Do not “improve” back toward Soft Miami Electric yellow→cyan, pink/peach nav chrome, or yellow→pink primary gradients without an explicit unlock from Frank.

## Restore

```bash
# from repo root
cp ops/design-locks/sold-blue-purple-20260918/miami-home-v25.css assets/css/
cp ops/design-locks/sold-blue-purple-20260918/pp-tokens.css assets/css/
cp ops/design-locks/sold-blue-purple-20260918/hero-rebuild.css assets/css/
cp ops/design-locks/sold-blue-purple-20260918/music-layer.css assets/css/
# then bump ?v= on CSS/JS link tags across *.html (and .pages-bust), commit, push
```

Live preview: https://faccett66.github.io/poolparty-preview/
