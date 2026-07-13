// Badge mark: a rounded squircle in the brand gradient with a checkmark-
// pulse glyph — "tracking a candidate through verified checkpoints," in the
// same abstract-geometric language as enterprise SaaS suite marks
// (deliberately not literal/illustrative, to sit naturally next to
// PayrollOS/PeopleOS/ProposalOS-style branding).
export function AppLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="appGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6D5AE6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#appGrad)" />
      <path
        d="M9.5 16.5 L14 21 L22.5 11.5"
        stroke="white"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
