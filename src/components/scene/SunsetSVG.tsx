/**
 * Line-art sunset scene for the landing hero. Elements carry classes the GSAP
 * intro targets (.sun, .ray, .horizon, .palm). See the hhgoa-motion skill.
 */
export default function SunsetSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 160"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroSun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fee101" />
          <stop offset="1" stopColor="#f9dc01" />
        </linearGradient>
      </defs>

      {/* rays */}
      <g stroke="#fee101" strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
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
            x1={180 + dx * 40}
            y1={120 + dy * 40}
            x2={180 + dx * 58}
            y2={120 + dy * 58}
          />
        ))}
      </g>

      {/* sun dome on the horizon, with retro stripes */}
      <g className="sun">
        <path d="M146,120 A34,34 0 0 1 214,120 Z" fill="url(#heroSun)" />
        <g stroke="#0b6839" strokeWidth="3">
          <line x1="146" y1="112" x2="214" y2="112" />
          <line x1="150" y1="103" x2="210" y2="103" />
          <line x1="156" y1="94" x2="204" y2="94" />
        </g>
      </g>

      {/* horizon + sea shimmer */}
      <line
        className="horizon"
        x1="24"
        y1="120"
        x2="336"
        y2="120"
        stroke="#fee101"
        strokeWidth="1.6"
      />
      <g stroke="#fee101" strokeWidth="1.4" opacity="0.4">
        <line x1="150" y1="128" x2="210" y2="128" />
        <line x1="158" y1="134" x2="202" y2="134" />
        <line x1="166" y1="140" x2="194" y2="140" />
      </g>

      {/* palms (cream line-art) */}
      <g
        className="palm"
        stroke="#fffbe8"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.92"
      >
        <path d="M48,158 Q42,116 56,80" />
        <path d="M56,80 Q34,66 14,74" />
        <path d="M56,80 Q40,56 26,48" />
        <path d="M56,80 Q58,52 60,36" />
        <path d="M56,80 Q76,56 94,52" />
        <path d="M56,80 Q74,66 92,80" />
        <circle cx="52" cy="83" r="2.4" fill="#fffbe8" stroke="none" />
        <circle cx="60" cy="85" r="2.2" fill="#fffbe8" stroke="none" />
      </g>
      <g
        className="palm"
        stroke="#fffbe8"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.92"
      >
        <path d="M312,158 Q318,116 304,80" />
        <path d="M304,80 Q326,66 346,74" />
        <path d="M304,80 Q320,56 334,48" />
        <path d="M304,80 Q302,52 300,36" />
        <path d="M304,80 Q284,56 266,52" />
        <path d="M304,80 Q286,66 268,80" />
        <circle cx="308" cy="83" r="2.4" fill="#fffbe8" stroke="none" />
        <circle cx="300" cy="85" r="2.2" fill="#fffbe8" stroke="none" />
      </g>
    </svg>
  );
}
