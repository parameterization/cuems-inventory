'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { canDoInventoryCheck, canManageUsers } from '@/lib/permissions';

type UserRole = 'ADMIN' | 'PROBIE' | 'DRIVER';

interface HamburgerMenuProps {
  userRole: UserRole;
}

export function HamburgerMenu({ userRole }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-50 p-4 bg-columbia-navy text-white shadow-xl hover:shadow-2xl hover:bg-blue-900 transition-all duration-200"
        aria-label="Menu"
      >
        {isOpen ? <X size={26} strokeWidth={2.5} /> : <Menu size={26} strokeWidth={2.5} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeMenu}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 glass-effect shadow-2xl z-40 transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-24 pb-8">
          <nav className="flex-1 px-6 space-y-2">
            <Link
              href="/take-remove"
              onClick={closeMenu}
              className="block px-5 py-4 text-lg font-semibold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                Take & Return
              </span>
            </Link>

            <Link
              href="/inventory-levels"
              onClick={closeMenu}
              className="block px-5 py-4 text-lg font-semibold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                Inventory Levels
              </span>
            </Link>

            {canDoInventoryCheck(userRole) && (
              <Link
                href="/inventory-check"
                onClick={closeMenu}
                className="block px-5 py-4 text-lg font-semibold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  Inventory Check
                </span>
              </Link>
            )}

            {canManageUsers(userRole) && (
              <Link
                href="/audit-logs"
                onClick={closeMenu}
                className="block px-5 py-4 text-lg font-semibold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  Audit Logs
                </span>
              </Link>
            )}

            {canManageUsers(userRole) && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="block px-5 py-4 text-lg font-semibold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  Admin Panel
                </span>
              </Link>
            )}
          </nav>

          <div className="px-6">
            <button
              onClick={handleLogout}
              className="w-full px-5 py-4 text-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl">🚪</span>
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

