import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const SendIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M14 2L7 9M14 2L9.5 14 7 9M14 2L2 6.5 7 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TextIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const FileIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M1.5 8C3 4.5 5 3 8 3s5 1.5 6.5 5C13 12.5 11 14 8 14S3 12.5 1.5 8z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 5.5V8l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const KeyIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <circle cx="6.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8.5 9L12 12.5M10.5 10.5l1.5 1.5M12 11l1.5-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const UploadIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M2.5 11v1.5A1 1 0 003.5 13.5h9a1 1 0 001-1V11M8 2.5v7M5 5.5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DownloadIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M8 2.5v7M5 7l3 3 3-3M2.5 11v1.5a1 1 0 001 1h9a1 1 0 001-1V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FireIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M8 14c-2.5 0-4.5-2-4.5-4.5 0-1.5.8-2.8 1.5-3.5 0 1.5 1 2 1.5 2C6.5 6 7 4 6.5 2.5 8 3 10.5 5 10.5 7.5c0 .5-.1.8-.5 1.5.5-.5.5-1.5.5-2.5 1 1.5 1.5 2.5 1.5 4C12 12 10.5 14 8 14z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M10 5.5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v5a1 1 0 001 1h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const SealIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M8 1.5L9.5 4.5 13 5 10.5 7.5 11 11 8 9.5 5 11 5.5 7.5 3 5 6.5 4.5 8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

export const ShieldIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M8 1.5l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6v-4l5-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export const RefreshIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9M13.5 2.5v3.5h-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AlertTriangleIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M8 2.5L14.5 13.5H1.5L8 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="11.2" r="0.6" fill="currentColor" />
  </svg>
);

export const LockIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect x="3" y="7.5" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5.5 7.5V5.5C5.5 4.12 6.62 3 8 3v0c1.38 0 2.5 1.12 2.5 2.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="10.75" r="1" fill="currentColor" />
  </svg>
);

export const BrandLockIcon = (p: IconProps) => (
  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect x="6" y="13" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 13V9.5C9 7.015 11.015 5 13.5 5v0C15.985 5 18 7.015 18 9.5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="13.5" cy="19" r="1.5" fill="currentColor" />
  </svg>
);

export const BrandMarkIcon = (p: IconProps) => (
  <svg viewBox="0 0 1280 1280" xmlns="http://www.w3.org/2000/svg" {...p}>
    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
      <path d="M10280 9439 c-41 -4 -118 -13 -170 -19 -52 -6 -135 -16 -185 -21
-152 -17 -257 -29 -325 -39 -72 -10 -271 -33 -425 -50 -167 -18 -268 -30 -318
-40 -27 -6 -63 -10 -80 -10 -17 0 -56 -4 -86 -10 -31 -5 -105 -14 -166 -20
-60 -6 -141 -15 -180 -20 -38 -5 -107 -14 -152 -20 -46 -5 -118 -14 -160 -20
-43 -5 -152 -20 -243 -31 -91 -12 -194 -25 -230 -30 -83 -12 -212 -27 -320
-39 -47 -5 -114 -14 -150 -20 -36 -6 -112 -15 -170 -20 -116 -10 -329 -35
-430 -49 -213 -31 -639 -85 -786 -101 -54 -5 -148 -17 -209 -25 -60 -8 -155
-20 -210 -25 -55 -6 -136 -15 -180 -21 -44 -5 -120 -14 -170 -19 -49 -5 -124
-14 -165 -20 -105 -15 -197 -26 -415 -49 -104 -11 -219 -25 -255 -30 -61 -9
-117 -17 -312 -41 -81 -11 -148 -21 -273 -41 -129 -20 -317 -42 -470 -53 -164
-13 -209 -24 -203 -54 5 -25 116 -50 233 -51 119 -2 434 -24 630 -45 77 -8
230 -22 340 -30 110 -9 254 -21 320 -26 66 -6 176 -15 245 -21 69 -5 161 -14
205 -19 44 -5 121 -12 170 -16 50 -3 140 -10 200 -15 61 -5 169 -14 240 -19
72 -5 222 -16 335 -25 113 -8 279 -20 370 -26 91 -6 224 -15 295 -20 72 -5
200 -13 285 -18 311 -18 500 -40 500 -58 0 -16 -301 -329 -992 -1028 -158
-159 -425 -431 -595 -602 -169 -172 -758 -765 -1308 -1319 -2003 -2016 -2194
-2209 -2187 -2216 11 -10 288 32 379 57 48 14 186 45 293 66 25 5 65 14 90 20
25 5 65 14 90 18 25 5 68 14 95 20 28 6 82 18 120 26 39 8 97 20 130 25 57 9
164 30 250 49 22 5 67 15 100 21 33 6 76 16 95 20 19 5 96 21 170 35 74 14
176 34 225 44 50 11 128 27 175 36 47 10 103 21 125 26 22 6 76 16 120 25 44
8 87 17 95 20 13 5 65 16 315 65 81 16 147 29 195 39 25 6 70 14 100 19 30 5
96 19 145 31 148 36 317 72 465 101 30 6 73 14 95 19 22 4 101 20 175 34 74
14 153 30 175 35 36 9 77 19 175 41 46 10 362 78 420 90 25 5 88 18 140 30 52
11 118 25 145 30 28 6 68 14 90 19 75 16 190 40 280 56 50 10 115 24 145 32
30 8 78 18 105 23 28 6 70 14 95 20 25 6 68 14 95 19 155 30 322 63 410 82 55
12 139 30 188 40 48 11 129 28 180 39 131 29 307 61 432 80 71 11 211 41 315
68 64 17 71 21 49 27 -15 3 -64 4 -110 2 -164 -10 -1171 -37 -2144 -57 -225
-5 -610 -13 -855 -19 -693 -16 -1481 -25 -1522 -17 -23 4 -38 13 -38 21 0 15
114 129 185 185 22 17 42 35 45 38 3 4 23 23 46 42 236 204 572 504 829 740
69 65 240 217 305 273 25 22 70 62 101 90 30 29 91 84 134 122 44 39 147 131
230 205 82 74 171 153 197 175 90 76 707 624 738 655 8 8 38 35 65 59 28 24
75 67 105 95 30 29 109 99 175 156 66 58 161 143 210 190 96 90 220 202 430
390 126 113 160 144 359 325 55 50 108 98 120 108 73 64 193 173 266 242 159
151 225 212 320 295 52 46 120 107 150 134 31 28 67 60 82 71 31 24 176 155
270 244 37 35 82 75 99 90 87 70 83 65 65 84 -19 19 -60 20 -186 6z" />
    </g>
  </svg>
);

export const HomeIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M2 7.5L8 2.5l6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 6.5V13a1 1 0 001 1h7a1 1 0 001-1V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HelpCircleIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M6.2 6.3c.2-.9 1-1.5 1.9-1.5.95 0 1.9.6 1.9 1.6 0 .85-.55 1.25-1.1 1.6-.5.3-.9.6-.9 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="11.1" r="0.6" fill="currentColor" />
  </svg>
);
