import type { Config } from 'tailwindcss';

// Token system — Workday/enterprise direction: formal, structured, heavier
// chrome. A dark navy sidebar anchors the app (real "system" weight, not a
// thin top bar), hairline borders define every region instead of soft
// shadows, and tables carry visible header/zebra structure rather than
// floating as loose rows. Accent shifts from a soft indigo to a flatter,
// more institutional blue.
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        paper: '#F8FAFC',
        line: '#CBD5E1',
        lineSoft: '#E2E8F0',
        accent: '#1D4ED8',
        accentSoft: '#DBEAFE',
        chrome: {
          bg: '#0B1220',
          bgHover: '#151F32',
          border: '#1E293B',
          text: '#CBD5E1',
          textMuted: '#64748B',
          textActive: '#FFFFFF',
        },
        status: {
          submitted: '#475569',
          review: '#92400E',
          shortlisted: '#075985',
          interview: '#6D28D9',
          offered: '#065F46',
          hired: '#166534',
          rejected: '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
