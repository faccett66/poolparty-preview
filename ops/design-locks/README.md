# Design locks (Pool Party preview)

When Frank locks a look, Studio must:

1. **Not change** the locked identity (palette / wash / chrome) unless Frank explicitly unlocks it.
2. **Keep a backup** under `ops/design-locks/<lock-id>/` with the exact CSS (and logo if tinted) that define the lock, plus a `LOCK.md` stating what is locked.
3. If something drifts, **restore from that folder** (copy files back, bump `?v=` cache, push) — do not reinvent.

Active lock target: **sold blue→purple washes** (see `sold-blue-purple-*` once snapshot lands).

Git history is not enough by itself — keep the snapshot files here.
