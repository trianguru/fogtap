# FogTap media hooks (Head Chahcho / Veo)

Live demo stills live in `/media/`:
- `door-clear.png` — clear glass porch door
- `door-fogged.png` — fogged privacy state
- `zac-zoey-ref.jpg` — Zac (~6'3", baseball cap) + Zoey (5) behind glass
- `fogtap-demo.mp4` — 8s Veo demo (muted loop on hero)
- `fogtap-demo-still.jpeg` — poster / clear-state still with Zac+Zoey

## Swap in Veo stills / video later

1. Drop files into `/media/` or `/assets/`.
2. Update `#doorScene` data attributes in `index.html`:
   - `data-door-clear` / `data-door-fogged` / `data-people`
   - `data-veo-still` — optional still URL
   - `data-veo-video` — defaults to `media/fogtap-demo.mp4`
3. Or set CSS vars on `#doorScene`:
   - `--door-clear`, `--door-fogged`, `--people-img`, `--veo-still`

Hero video uses `media/fogtap-demo.mp4` + `poster=media/fogtap-demo-still.jpeg`.
