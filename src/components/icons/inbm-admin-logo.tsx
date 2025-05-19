import type { SVGProps } from 'react';

export function InbmAdminLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      version="1.1"
      id="Layer_1_Admin_Logo"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 294.2 108.5"
      xmlSpace="preserve"
      {...props}
    >
      <style type="text/css">{`
        .st0-admin-logo { fill:hsl(var(--primary)); }
        .st1-admin-logo { fill:hsl(var(--accent)); }
        .st2-admin-logo { font-family:var(--font-geist-sans), Helvetica, Arial, sans-serif; font-weight: bold; }
        .st3-admin-logo { font-size:45px; }
        .st4-admin-logo { letter-spacing:-2px; }
        .st5-admin-logo { font-family:var(--font-geist-sans), Helvetica, Arial, sans-serif; }
        .st6-admin-logo { font-size:14px; }
        .st7-admin-logo { letter-spacing:-1px; }
      `}</style>
      <g>
        <rect x="1.4" y="1.3" className="st0-admin-logo" width="105.8" height="105.8" />
        <g>
          <path
            className="st1-admin-logo"
            d="M88.4,87.1V69.8h13.3v17.4H88.4z M20.7,87.1V21.5h13.3v17.4h22.1V21.5h13.3v48.4H56.1v-9.8H33.9v9.8H20.7z M56.1,59.6V50h-22v9.6H56.1z"
          />
        </g>
        <text transform="matrix(1 0 0 1 121.3789 53.9687)" className="st0-admin-logo st2-admin-logo st3-admin-logo st4-admin-logo">
          INBM
        </text>
        <text transform="matrix(1 0 0 1 121.3789 75.9843)" className="st1-admin-logo st5-admin-logo st6-admin-logo st7-admin-logo">
          PAINEL ADMINISTRATIVO
        </text>
      </g>
    </svg>
  );
}
