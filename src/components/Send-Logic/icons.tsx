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

export const HelpCircleIcon = (p: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M6.2 6.3c.2-.9 1-1.5 1.9-1.5.95 0 1.9.6 1.9 1.6 0 .85-.55 1.25-1.1 1.6-.5.3-.9.6-.9 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="11.1" r="0.6" fill="currentColor" />
  </svg>
);
