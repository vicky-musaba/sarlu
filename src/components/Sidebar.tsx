'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { path: '/dashboard', icon: '🏠', label: 'Tableau de bord', roles: ['admin', 'supervisor', 'auditor', 'cashier'] },
  { path: '/new-output', icon: '💰', label: 'Nouvelle sortie', roles: ['admin', 'cashier'] },
  { path: '/validation', icon: '✅', label: 'Validation', roles: ['admin', 'supervisor'] },
  { path: '/history', icon: '📋', label: 'Historique', roles: ['admin', 'supervisor', 'auditor', 'cashier'] },
  { path: '/reports', icon: '📊', label: 'Rapports', roles: ['admin', 'auditor'] },
  { path: '/categories', icon: '🏷️', label: 'Catégories', roles: ['admin'] },
  { path: '/cash', icon: '💵', label: 'Caisse', roles: ['admin', 'supervisor', 'auditor', 'cashier'] },
  { path: '/audit', icon: '🧾', label: 'Journal d\'audit', roles: ['admin', 'auditor'] },
  { path: '/backup', icon: '💾', label: 'Sauvegardes', roles: ['admin'] },
  { path: '/settings', icon: '⚙️', label: 'Paramètres', roles: ['admin'] },
  { path: '/diagnostic', icon: '🔧', label: 'Diagnostic', roles: ['admin'] },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin, isCashier, loading } = useAuth();
  const userRole = user?.role || '';

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
        <div className="p-6 border-b border-gray-700">
          <img src="/logo.png" alt="LE SECOURS SARLU" className="h-12 w-auto mb-2" />
          <h1 className="text-xl font-bold">LE SECOURS SARLU</h1>
          <p className="text-sm text-gray-400 mt-1">Gestion de Caisse</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-gray-700">
        <img src="/logo.png" alt="LE SECOURS SARLU" className="h-12 w-auto mb-2" />
        <h1 className="text-xl font-bold">LE SECOURS SARLU</h1>
        <p className="text-sm text-gray-400 mt-1">Gestion de Caisse</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="mb-4">
          <p className="text-sm text-gray-400">Connecté en tant que :</p>
          <p className="font-medium">{user?.username || 'Chargement...'}</p>
          <p className="text-xs text-gray-500 capitalize">
            {user?.role === 'admin' ? 'Administrateur' : user?.role === 'supervisor' ? 'Superviseur' : user?.role === 'auditor' ? 'Auditrice' : user?.role === 'cashier' ? 'Caissière' : 'Inconnu'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};
