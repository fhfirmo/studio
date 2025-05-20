import type { SVGProps } from 'react';

export function InbmBrandLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 180 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <style>{`
        .inbm-brand-arc-path { fill: #4CAF50; /* Green */ }
        .inbm-brand-text {
          font-family: var(--font-geist-sans, Arial, sans-serif);
          font-weight: bold;
          font-size: 48px;
          fill: #FFFFFF; /* White */
        }
      `}</style>
      <path className="inbm-brand-arc-path" d="M15 58 C 22 28, 59 18, 82 38 C 74 44, 31 48, 15 58 Z" />
      <text x="20" y="85" className="inbm-brand-text">INBM</text>
    </svg>
  );
}
