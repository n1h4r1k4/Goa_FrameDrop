/**
 * Twinkling stars over the night-beach background. Positions are generated from
 * a fixed seed (never Math.random) so the server and client markup match, and
 * the twinkle is pure CSS so it costs nothing on the main thread. Sits behind
 * the page content and disappears under prefers-reduced-motion.
 */

const COUNT = 70;

// deterministic pseudo-random: same sequence every render, on both sides
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(20261028);
const STARS = Array.from({ length: COUNT }, () => {
  const r = () => Math.round(rand() * 10000) / 100;
  return {
    left: r(),
    // keep them in the sky, not on the sand
    top: Math.round(rand() * 5800) / 100,
    size: Math.round((0.8 + rand() * 1.8) * 100) / 100,
    delay: Math.round(rand() * 600) / 100,
    duration: Math.round((2.4 + rand() * 3.6) * 100) / 100,
    opacity: Math.round((0.35 + rand() * 0.5) * 100) / 100,
  };
});

export default function Starfield() {
  return (
    <div aria-hidden className="hh-stars">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="hh-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
