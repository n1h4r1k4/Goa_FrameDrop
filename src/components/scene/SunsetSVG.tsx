/**
 * Line-art Goa beach scene for the landing hero. Elements carry classes the GSAP
 * intro targets (.sun, .ray, .horizon, .palm, .scene-el). See the hhgoa-motion skill.
 */

const CREAM = "#fffbe8";
const SUN = "#fee101";
const SUN3 = "#f9dc01";
const HILL = "#12784a";
const PINK = "#e6198a";

function Palm({
  x,
  y,
  s,
  flip,
}: {
  x: number;
  y: number;
  s: number;
  flip?: boolean;
}) {
  return (
    <g
      className="palm"
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}
      stroke={CREAM}
      strokeWidth={2.4 / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M0,0 Q-4,-55 12,-100" />
      <path d="M12,-100 Q-18,-112 -36,-104" />
      <path d="M12,-100 Q-8,-126 -22,-136" />
      <path d="M12,-100 Q14,-130 16,-148" />
      <path d="M12,-100 Q42,-126 60,-118" />
      <path d="M12,-100 Q34,-112 54,-104" />
      <circle cx="9" cy="-97" r={3 / s} fill={CREAM} stroke="none" />
      <circle cx="16" cy="-95" r={2.6 / s} fill={CREAM} stroke="none" />
    </g>
  );
}

function Villa({ x, y }: { x: number; y: number }) {
  return (
    <g
      className="scene-el"
      transform={`translate(${x} ${y})`}
      stroke={CREAM}
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M0,0 h34 v-22 h-34 z" />
      <path d="M-5,-22 L17,-37 L39,-22" />
      <rect x="6" y="-16" width="8" height="8" />
      <rect x="21" y="-15" width="8" height="15" fill={PINK} stroke={CREAM} />
    </g>
  );
}

export default function SunsetSVG({ className = "" }: { className?: string }) {
  const palms = [
    { x: 24, y: 170, s: 1.45, flip: false },
    { x: 376, y: 170, s: 1.45, flip: true },
    { x: 92, y: 170, s: 0.9, flip: false },
    { x: 312, y: 170, s: 0.9, flip: true },
    { x: 168, y: 170, s: 0.6, flip: false },
  ];

  return (
    <svg viewBox="0 0 400 170" className={className} fill="none" aria-hidden="true">
      {/* hills behind the horizon */}
      <path className="scene-el" d="M0,96 Q70,66 165,96 Z" fill={HILL} />
      <path className="scene-el" d="M235,96 Q320,64 400,96 Z" fill={HILL} />

      {/* rays */}
      <g stroke={SUN} strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
        {[
          [-0.8, -0.6],
          [-0.5, -0.86],
          [-0.17, -0.98],
          [0.17, -0.98],
          [0.5, -0.86],
          [0.8, -0.6],
        ].map(([dx, dy], i) => (
          <line
            key={i}
            className="ray"
            x1={200 + dx * 40}
            y1={96 + dy * 40}
            x2={200 + dx * 60}
            y2={96 + dy * 60}
          />
        ))}
      </g>

      {/* sun dome on the horizon + retro stripes */}
      <g className="sun">
        <path d="M166,96 A34,34 0 0 1 234,96 Z" fill={SUN} />
        <g stroke="#0b6839" strokeWidth="3">
          <line x1="166" y1="88" x2="234" y2="88" />
          <line x1="170" y1="79" x2="230" y2="79" />
          <line x1="176" y1="70" x2="224" y2="70" />
        </g>
      </g>

      {/* horizon + sun reflection ripples */}
      <line
        className="horizon"
        x1="18"
        y1="96"
        x2="382"
        y2="96"
        stroke={SUN}
        strokeWidth="1.6"
      />
      <g className="scene-el" fill={SUN3}>
        <ellipse cx="200" cy="103" rx="30" ry="2.4" />
        <ellipse cx="200" cy="109" rx="22" ry="2" />
        <ellipse cx="200" cy="115" rx="14" ry="1.7" />
      </g>

      {/* sea wave ticks */}
      <g className="scene-el" stroke={CREAM} strokeWidth="1.4" opacity="0.6" strokeLinecap="round">
        <path d="M40,104 q6,-3 12,0 t12,0" fill="none" />
        <path d="M300,106 q6,-3 12,0 t12,0" fill="none" />
        <path d="M330,100 q6,-3 12,0 t12,0" fill="none" />
      </g>

      {/* boat */}
      <g className="scene-el" transform="translate(96 90)" stroke={CREAM} strokeWidth="2" fill="none" strokeLinejoin="round">
        <path d="M0,0 q10,8 22,0 z" />
        <line x1="11" y1="0" x2="11" y2="-12" />
        <path d="M11,-12 L20,-5 L11,-5 z" fill={CREAM} />
      </g>

      {/* villas */}
      <Villa x={52} y={150} />
      <Villa x={318} y={150} />

      {/* beach umbrella */}
      <g className="scene-el" transform="translate(244 128)">
        <path d="M0,0 a15,11 0 0 1 30,0 z" fill={SUN} stroke={CREAM} strokeWidth="1.6" />
        <path d="M15,0 v20" stroke={CREAM} strokeWidth="2" />
      </g>

      {/* palms in front */}
      {palms.map((p, i) => (
        <Palm key={i} {...p} />
      ))}
    </svg>
  );
}
