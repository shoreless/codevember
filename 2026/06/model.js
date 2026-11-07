export const duration = 44;
export const tau = Math.PI * 2;
export const mix = (a, b, t) => a + (b - a) * t;
export function ease(start, end, value) {
  const p = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return p * p * (3 - 2 * p);
}
export function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
// Radii and periods are composed for the instrument's dial. Both reference
// frames use exactly the same positions and time.
export const planets = [
  { name: 'Mercury', orbit: .58, speed: 1.19, phase: 1.3, size: .044, color: '#b6a591' },
  { name: 'Venus', orbit: .94, speed: .62, phase: 3.8, size: .084, color: '#d0a473' },
  { name: 'Earth', orbit: 1.42, speed: .38, phase: .65, size: .112, color: '#71acab' },
  { name: 'Mars', orbit: 1.94, speed: .25, phase: 3.5, size: .071, color: '#c77751' },
  { name: 'Jupiter', orbit: 2.75, speed: .13, phase: 1.9, size: .17, color: '#bc9681' },
  { name: 'Saturn', orbit: 3.50, speed: .088, phase: 5.7, size: .145, color: '#cbb68f' }
];
export function position(body, t) {
  const angle = t * body.speed + body.phase;
  return { x: body.orbit * Math.cos(angle), y: body.orbit * Math.sin(angle) };
}
export function relativePosition(body, t, sunView) {
  const planet = position(body, t);
  const earth = position(planets[2], t);
  return { x: planet.x - (1 - sunView) * earth.x, y: planet.y - (1 - sunView) * earth.y };
}
// Fixed comoving coordinates. The same scale factor multiplies every
// separation, regardless of which galaxy the observer selects.
export function separation(point, observer, t) {
  const scaleFactor = Math.exp((t - 20) * .049);
  return { x: (point.x - observer.x) * scaleFactor, y: (point.y - observer.y) * scaleFactor };
}
export function galaxyAt(col, row) {
  if (!col && !row) return { col, row, x: 0, y: 0, angle: -.45, size: 1.15, texture: 0 };
  const dice = random(Math.imul(col, 73856093) ^ Math.imul(row, 19349663));
  return {
    col, row, x: col * .52 + (dice() - .5) * .32,
    y: row * .50 + (dice() - .5) * .30, angle: dice() * tau,
    size: .55 + dice() * .72, texture: Math.floor(dice() * 3)
  };
}
