// Gameplay approximation of spray icing, not a vessel-stability model.
export const ICE_STOP = .72;
export const DEICE_SECONDS = 24;
export const iceLevel = n => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
export function iceRate(w, speed = 0, sheltered = false) {
 if (!Number.isFinite(w.temperature)) return 0;
 if (w.temperature >= 0) return -(w.temperature + .5) / 380;
 if (sheltered) return 0;
 const cold = Math.min(1, -w.temperature / 6);
 const spray = Math.min(1, Math.max(0, (w.waves - .6) / 5) * .55 + Math.max(0, (w.wind - 8) / 42) * .32 + Math.abs(speed) * .025);
 return cold * (.001 + spray * .012 + (w.snow || 0) * .003 + (w.rain || 0) * .002);
}
