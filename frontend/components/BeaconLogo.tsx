// Simple geometric mark: a beacon light — radiating cone + core, in the
// brand gradient. Hand-coded SVG, no external asset needed.
export function BeaconLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="beaconGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6D5AE6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path d="M16 4 L24 26 C21.5 27.5 18.8 28.3 16 28.3 C13.2 28.3 10.5 27.5 8 26 Z" fill="url(#beaconGrad)" opacity="0.18" />
      <path d="M16 9 L20.5 24 C19.1 24.8 17.6 25.2 16 25.2 C14.4 25.2 12.9 24.8 11.5 24 Z" fill="url(#beaconGrad)" opacity="0.4" />
      <circle cx="16" cy="8" r="4.5" fill="url(#beaconGrad)" />
      <circle cx="16" cy="8" r="2" fill="white" opacity="0.85" />
    </svg>
  );
}
