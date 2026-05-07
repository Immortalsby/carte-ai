"use client";

import { memo } from "react";

export type MascotState = "idle" | "talking" | "thinking" | "happy" | "concerned";

/** Map component state names to CSS class suffixes */
const STATE_CLASS: Record<MascotState, string> = {
  idle: "state-idle",
  talking: "state-talk",
  thinking: "state-thinking",
  happy: "state-happy",
  concerned: "state-concerned",
};

interface CSSMascotProps {
  state: MascotState;
  onClick?: () => void;
  className?: string;
}

/**
 * Pure SVG + CSS animated mascot — the CarteAI Cloché character.
 * No drag/zoom — fixed position, responsive size via className.
 *
 * Five expression states driven by a CSS class on the SVG root.
 */
function CSSMascotInner({ state, onClick, className = "" }: CSSMascotProps) {
  const svgClass = STATE_CLASS[state];

  return (
    <div
      className={className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="AI Assistant"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <style>{`
        /* ── Sparkle ── */
        @keyframes m-sparkle-pulse{0%,100%{transform:scale(1) rotate(0);opacity:1}50%{transform:scale(1.18) rotate(8deg);opacity:.92}}
        @keyframes m-sparkle-think{0%,100%{transform:translateY(0) scale(.96) rotate(0);opacity:.82}50%{transform:translateY(-6px) scale(1.08) rotate(18deg);opacity:1}}
        @keyframes m-sparkle-happy{0%,100%{transform:scale(1) rotate(0);opacity:1}38%{transform:scale(1.42) rotate(14deg);opacity:1}62%{transform:scale(.92) rotate(-5deg);opacity:.9}}
        @keyframes m-sparkle-concerned{0%,100%{transform:scale(.82) rotate(0);opacity:.62}50%{transform:scale(.92) rotate(4deg);opacity:.76}}

        /* ── Body ── */
        @keyframes m-body-idle{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes m-body-talk{0%,12%,36%,58%,78%,100%{transform:translateY(0)}20%{transform:translateY(-.8px)}45%{transform:translateY(-1.2px)}67%{transform:translateY(-.5px)}}
        @keyframes m-body-happy{0%,100%{transform:translateY(0)}35%{transform:translateY(-10px)}64%{transform:translateY(2px)}}
        @keyframes m-body-concerned{0%,100%{transform:translateY(4px)}50%{transform:translateY(6px)}}

        /* ── Eye blink ── */
        @keyframes m-eye-blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.05)}98%{transform:scaleY(1)}}

        /* ── Dome ── */
        @keyframes m-dome-idle{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-.6deg)}}
        @keyframes m-dome-talk{0%,8%{transform:rotate(0deg)}15%{transform:rotate(5deg)}23%{transform:rotate(1deg)}34%,43%{transform:rotate(0deg)}51%{transform:rotate(10deg)}60%{transform:rotate(3deg)}70%{transform:rotate(6deg)}78%{transform:rotate(1.5deg)}88%,100%{transform:rotate(0deg)}}
        @keyframes m-dome-thinking{0%,100%{transform:rotate(0deg)}50%{transform:rotate(1.8deg)}}
        @keyframes m-dome-happy{0%,100%{transform:rotate(4deg)}36%{transform:rotate(8deg)}66%{transform:rotate(3deg)}}
        @keyframes m-dome-concerned{0%,100%{transform:rotate(1deg)}50%{transform:rotate(.3deg)}}

        /* ── Eye motion ── */
        @keyframes m-eye-drift{0%,40%,100%{transform:translate(0,0)}50%,70%{transform:translate(2px,0)}80%,90%{transform:translate(-2px,0)}}
        @keyframes m-eye-talk{0%,100%{transform:translate(0,0)}42%{transform:translate(0,-1px)}72%{transform:translate(0,.8px)}}
        @keyframes m-pupil-thinking{0%{transform:translate(0,0)}45%,100%{transform:translate(-5px,-6px)}}
        @keyframes m-eye-happy{0%,100%{transform:scaleY(.32) translateY(1px)}50%{transform:scaleY(.24) translateY(2px)}}
        @keyframes m-eye-concerned{0%,100%{transform:translate(5px,1px) scale(.76)}50%{transform:translate(4px,1px) scale(.72)}}

        /* ── Shared transform-box ── */
        .m-body,.m-mouth,.m-eye-drift,.m-eye-expr,.m-pupil,.m-sparkle{transform-box:fill-box;transform-origin:center}
        .m-dome{transform-box:view-box;transform-origin:center}
        .m-pupil{animation:m-eye-blink 4.2s ease-in-out infinite}

        /* ══ STATE: idle ══ */
        .state-idle .m-body{animation:m-body-idle 3.2s ease-in-out infinite}
        .state-idle .m-dome{animation:m-dome-idle 3s ease-in-out infinite}
        .state-idle .m-eye-drift{animation:m-eye-drift 5s ease-in-out infinite}
        .state-idle .m-sparkle{animation:m-sparkle-pulse 2.8s ease-in-out infinite}

        /* ══ STATE: talk ══ */
        .state-talk .m-body{animation:m-body-talk 1.65s ease-in-out infinite}
        .state-talk .m-dome{animation:m-dome-talk 1.65s cubic-bezier(.37,0,.28,1) infinite}
        .state-talk .m-eye-drift{animation:m-eye-talk 1.65s ease-in-out infinite}
        .state-talk .m-sparkle{animation:m-sparkle-pulse 2.8s ease-in-out infinite}

        /* ══ STATE: thinking ══ */
        .state-thinking .m-body{animation:m-body-idle 5s ease-in-out infinite}
        .state-thinking .m-mouth{transform:scaleY(.45)}
        .state-thinking .m-dome{animation:m-dome-thinking 4.8s ease-in-out infinite}
        .state-thinking .m-pupil{animation:m-pupil-thinking 3.6s ease-in-out infinite}
        .state-thinking .m-sparkle{animation:m-sparkle-think 3s ease-in-out infinite}

        /* ══ STATE: happy ══ */
        .state-happy .m-body{animation:m-body-happy .72s ease-in-out infinite}
        .state-happy .m-dome{animation:m-dome-happy .72s ease-in-out infinite}
        .state-happy .m-eye-expr{animation:m-eye-happy 1.2s ease-in-out infinite}
        .state-happy .m-sparkle{animation:m-sparkle-happy .8s ease-in-out infinite}

        /* ══ STATE: concerned ══ */
        .state-concerned .m-body{animation:m-body-concerned 3.6s ease-in-out infinite}
        .state-concerned .m-mouth{transform:scaleY(.28)}
        .state-concerned .m-dome{animation:m-dome-concerned 4s ease-in-out infinite}
        .state-concerned .m-eye-expr{animation:m-eye-concerned 3.2s ease-in-out infinite}
        .state-concerned .m-sparkle{animation:m-sparkle-concerned 3.8s ease-in-out infinite}
      `}</style>

      <svg viewBox="0 0 600 600" width="100%" height="100%" className={svgClass}>
        {/* ── Sparkle ── */}
        <g transform="translate(300,170)">
          <g className="m-sparkle">
            <path d="M0,-26 L4.5,-9 L21,-4.5 L4.5,0 L0,17 L-4.5,0 L-21,-4.5 L-4.5,-9 Z" fill="#d4a574"/>
          </g>
        </g>

        {/* ── Body wrapper (bob / bounce / sink) ── */}
        <g className="m-body">
          {/* Mouth cavity (always in DOM, scaled by CSS per state) */}
          <g className="m-mouth">
            <path d="M180,360 L420,360 L420,360 L180,378 Z" fill="#050507"/>
            <path d="M200,365 L400,360 L400,361 L200,372 Z" fill="#0a3a2c" opacity="0.7"/>
          </g>

          {/* Plate */}
          <g>
            <ellipse cx="300" cy="372" rx="170" ry="9" fill="#10b981"/>
            <path d="M130,372 Q132,378 140,378" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
            <path d="M470,372 Q468,378 460,378" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
          </g>

          {/* Dome (hinges at right rim) */}
          <g className="m-dome" style={{ transformOrigin: "420px 360px" }}>
            <path d="M180,360 A120,108 0 0 1 420,360" fill="none" stroke="#10b981" strokeWidth="11" strokeLinecap="round"/>
            <path d="M214,332 A82,72 0 0 1 280,272" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" opacity="0.55"/>
            <path d="M180,360 L420,360" stroke="#10b981" strokeWidth="11" strokeLinecap="round"/>

            {/* Eye */}
            <g transform="translate(245,300)">
              <g className="m-eye-drift">
                <g className="m-eye-expr">
                  <ellipse cx="0" cy="0" rx="16" ry="18" fill="#fafaf7" stroke="#050507" strokeWidth="2.5"/>
                  <g className="m-pupil">
                    <ellipse cx="2" cy="2" rx="9" ry="11" fill="#050507"/>
                    <ellipse cx="5" cy="-3" rx="3.2" ry="3.6" fill="#fafaf7"/>
                    <ellipse cx="-2" cy="5" rx="1.4" ry="1.6" fill="#fafaf7" opacity="0.7"/>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export const CSSMascot = memo(CSSMascotInner);
