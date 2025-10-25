'use client';

import Link from 'next/link';
import { useAuth } from '../providers';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const [showPromo, setShowPromo] = useState(true);
  useEffect(() => {
    try {
      const hidden = typeof window !== 'undefined' && localStorage.getItem('hidePromo') === '1';
      if (hidden) setShowPromo(false);
    } catch {}
  }, []);
  const handleClosePromo = () => {
    setShowPromo(false);
    try { localStorage.setItem('hidePromo', '1'); } catch {}
  };

  return (
    <>
      {showPromo && (
        <div className="bg-indigo-600 text-white text-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center md:justify-between gap-3">
            <div className="text-center md:text-left">
              Promo: Gunakan kode <span className="font-semibold">PROMO10</span> untuk diskon 10% tiket!
              <Link href="/events" className="ml-2 underline hover:no-underline">Lihat Event</Link>
            </div>
            <button
              aria-label="Tutup promo"
              onClick={handleClosePromo}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-700 hover:bg-indigo-500 text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                  KedaiEvent
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Beranda
                </Link>
                <Link
                  href="/events"
                  className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Event
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/admin/transactions"
                    className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-700">{user?.name || user?.email}</span>
                  <button onClick={handleLogout} className="btn btn-outline">Logout</button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className="btn btn-outline"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn btn-primary"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}