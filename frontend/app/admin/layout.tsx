'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSessionUser, SessionUser } from '@/lib/auth';
import { BeaconLogo } from '@/components/BeaconLogo';
import { TopLoadingBar } from '@/components/TopLoadingBar';

const NAV = [
  { href: '/admin', label: 'Dashboard', match: (p: string) => p === '/admin' },
  { href: '/admin/applications', label: 'Applications', match: (p: string) => p.startsWith('/admin/applications') },
  { href: '/admin/jobs', label: 'Job postings', match: (p: string) => p.startsWith('/admin/jobs') },
  { href: '/admin/settings/team', label: 'Team', match: (p: string) => p.startsWith('/admin/settings/team') },
  { href: '/admin/settings/company', label: 'Company profile', match: (p: string) => p.startsWith('/admin/settings/company') },
  { href: '/admin/settings/email', label: 'Email templates', match: (p: string) => p.startsWith('/admin/settings/email') },
  { href: '/admin/settings/profile', label: 'Your profile', match: (p: string) => p.startsWith('/admin/settings/profile') },
];

const PAGE_TITLES: [(p: string) => boolean, string][] = [
  [(p) => p === '/admin', 'Dashboard'],
  [(p) => p.startsWith('/admin/applications/'), 'Application detail'],
  [(p) => p.startsWith('/admin/applications'), 'Applications'],
  [(p) => p.startsWith('/admin/jobs'), 'Job postings'],
  [(p) => p.startsWith('/admin/settings/team'), 'Team'],
  [(p) => p.startsWith('/admin/settings/company'), 'Company profile'],
  [(p) => p.startsWith('/admin/settings/email'), 'Email templates'],
  [(p) => p.startsWith('/admin/settings/profile'), 'Your profile'],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const sessionUser = getSessionUser();
    setUser(sessionUser);
    if (sessionUser?.mustChangePassword) {
      router.push('/change-password');
    }
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  const pageTitle = PAGE_TITLES.find(([match]) => match(pathname))?.[1] ?? 'Dashboard';

  return (
    <div className="min-h-screen flex">
      <TopLoadingBar />

      <aside className="w-60 shrink-0 glass-panel border-r flex flex-col m-3 mr-0 rounded-2xl">
        <div className="h-16 flex items-center gap-2.5 px-5">
          <BeaconLogo size={26} />
          <span className="text-base font-extrabold tracking-tight text-ink">Beacon</span>
        </div>
        <nav className="flex-1 py-2 px-3">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <a
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center h-10 px-3.5 mb-0.5 text-sm rounded-xl transition-all',
                  active
                    ? 'bg-beacon-gradient text-white font-medium shadow-sm shadow-accent/30'
                    : 'text-chrome-text hover:bg-chrome-bgHover hover:text-ink',
                ].join(' ')}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-chrome-textMuted hover:text-ink px-3.5 py-2 rounded-xl hover:bg-chrome-bgHover transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-panel border-b-0 flex items-center justify-between px-8 m-3 mb-0 rounded-2xl">
          <p className="text-sm text-ink/50 font-mono uppercase tracking-wide">{pageTitle}</p>
          {user && (
            <a href="/admin/settings/profile" className="flex items-center gap-2.5 hover:opacity-80">
              <div className="w-8 h-8 rounded-full bg-beacon-gradient text-white flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0 shadow-sm">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  : user.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm text-ink/70">{user.name}</span>
            </a>
          )}
        </header>
        <main className="flex-1 px-8 py-8 max-w-6xl w-full">{children}</main>
      </div>
    </div>
  );
}
