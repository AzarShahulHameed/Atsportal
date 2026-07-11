'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSessionUser, SessionUser } from '@/lib/auth';

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
    // A temp-password account can't use the rest of the console until it sets its own.
    if (sessionUser?.mustChangePassword) {
      router.push('/change-password');
    }
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  const pageTitle = PAGE_TITLES.find(([match]) => match(pathname))?.[1] ?? 'Review dashboard';

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-60 shrink-0 bg-chrome-bg flex flex-col border-r border-chrome-border">
        <div className="h-16 flex items-center px-5 border-b border-chrome-border">
          <span className="font-mono text-xs uppercase tracking-widest text-chrome-textActive font-medium">
            ATS Portal
          </span>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <a
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center h-10 px-5 text-sm border-l-2 transition-colors',
                  active
                    ? 'border-accent bg-chrome-bgHover text-chrome-textActive font-medium'
                    : 'border-transparent text-chrome-text hover:bg-chrome-bgHover hover:text-chrome-textActive',
                ].join(' ')}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-chrome-border">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-chrome-textMuted hover:text-chrome-textActive px-1 py-1.5"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-line bg-white flex items-center justify-between px-8">
          <p className="text-sm text-ink/50 font-mono uppercase tracking-wide">{pageTitle}</p>
          {user && (
            <a href="/admin/settings/profile" className="flex items-center gap-2.5 hover:opacity-80">
              <div className="w-7 h-7 bg-accentSoft text-accent flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
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
