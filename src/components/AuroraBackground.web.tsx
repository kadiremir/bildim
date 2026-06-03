import React from 'react';

// ─── Golden Hour palette — warm gold / rose / amber / violet over dark brown ──

type Blob = {
  cx: number; cy: number; w: number; h: number;
  col: string; dur: number; del: number; anim: string;
};

const BLOBS: Blob[] = [
  { cx: 20, cy: 12, w: 90, h: 68, col: '#f59e0b', dur: 19, del: 0,   anim: 'd3' },
  { cx: 74, cy: 9,  w: 84, h: 66, col: '#fb7185', dur: 23, del: -5,  anim: 'd1' },
  { cx: 50, cy: 48, w: 98, h: 80, col: '#f97316', dur: 28, del: -9,  anim: 'd0' },
  { cx: 15, cy: 68, w: 80, h: 60, col: '#fde68a', dur: 17, del: -3,  anim: 'd2' },
  { cx: 85, cy: 63, w: 72, h: 62, col: '#c026d3', dur: 29, del: -13, anim: 'd1' },
  { cx: 60, cy: 24, w: 68, h: 52, col: '#fbbf24', dur: 16, del: -7,  anim: 'd3' },
  { cx: 36, cy: 80, w: 86, h: 60, col: '#db2777', dur: 25, del: -11, anim: 'd0' },
];

const CSS = `
@keyframes aur-d0{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(7%,9%) scale(1.1)}50%{transform:translate(-6%,5%) scale(.94)}75%{transform:translate(4%,-7%) scale(1.06)}}
@keyframes aur-d1{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}33%{transform:translate(-8%,6%) scale(1.09) rotate(9deg)}66%{transform:translate(6%,-9%) scale(.91) rotate(-6deg)}}
@keyframes aur-d2{0%,100%{transform:translate(0,0) scale(1)}20%{transform:translate(9%,-6%) scale(1.13)}40%{transform:translate(-5%,10%) scale(.89)}60%{transform:translate(7%,4%) scale(1.08)}80%{transform:translate(-8%,-5%) scale(.97)}}
@keyframes aur-d3{0%,100%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(-5%,8%) rotate(15deg) scale(1.12)}}
`;

export function AuroraBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0e0800',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* liquid distortion filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
        <defs>
          <filter
            id="auroraLiq"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.011 0.007"
              numOctaves={4}
              seed={9}
              result="n"
            >
              <animate
                attributeName="baseFrequency"
                dur="22s"
                keyTimes="0;0.5;1"
                values="0.011 0.007;0.007 0.013;0.011 0.007"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={110}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* warped, screen-blended aurora blobs */}
      <div style={{ position: 'absolute', inset: 0, filter: 'url(#auroraLiq)' }}>
        {BLOBS.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${b.cx - b.w / 2}%`,
              top: `${b.cy - b.h / 2}%`,
              width: `${b.w}%`,
              height: `${b.h}%`,
              borderRadius: '50%',
              mixBlendMode: 'screen',
              background: `radial-gradient(ellipse at 38% 38%, ${b.col}60 0%, ${b.col}28 38%, ${b.col}08 65%, transparent 80%)`,
              animation: `aur-${b.anim} ${b.dur}s ${b.del}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* cinematic vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 80% at 50% 42%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
