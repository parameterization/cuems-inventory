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
              className="block px-6 py-4 text-base font-bold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy uppercase tracking-wide"
            >
              Take & Return
            </Link>

            <Link
              href="/inventory-levels"
              onClick={closeMenu}
              className="block px-6 py-4 text-base font-bold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy uppercase tracking-wide"
            >
              Inventory Levels
            </Link>

            {canDoInventoryCheck(userRole) && (
              <Link
                href="/inventory-check"
                onClick={closeMenu}
                className="block px-6 py-4 text-base font-bold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy uppercase tracking-wide"
              >
                Inventory Check
              </Link>
            )}

            {canManageUsers(userRole) && (
              <Link
                href="/audit-logs"
                onClick={closeMenu}
                className="block px-6 py-4 text-base font-bold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy uppercase tracking-wide"
              >
                Audit Logs
              </Link>
            )}

            {canManageUsers(userRole) && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="block px-6 py-4 text-base font-bold text-columbia-navy hover:bg-blue-100 transition-all border-l-4 border-transparent hover:border-columbia-navy uppercase tracking-wide"
              >
                Admin Panel
              </Link>
            )}
          </nav>

          <div className="px-6 space-y-3 mt-4">
            <div className="border-t-2 border-gray-200 pt-4">
              <Link
                href="/change-password"
                onClick={closeMenu}
                className="block px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all border-2 border-gray-300 hover:border-gray-400 uppercase tracking-wide text-center"
              >
                Change Password
              </Link>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full px-6 py-4 text-base font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg uppercase tracking-wide"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

