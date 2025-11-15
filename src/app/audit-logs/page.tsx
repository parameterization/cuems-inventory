'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  user: { email: string };
  item: { name: string };
  action: string;
  before: number;
  after: number;
  timestamp: string;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/take-remove');
    }
  }, [session, router]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (actionFilter !== 'ALL') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchQuery, actionFilter]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/audit-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        setFilteredLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date/Time', 'User', 'Action', 'Item', 'Before', 'After', 'Change'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user.email,
      log.action,
      log.item.name,
      log.before,
      log.after,
      (log.after - log.before).toString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuems-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-columbia-navy">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {session && <HamburgerMenu userRole={session.user.role} />}

      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-columbia-navy mb-2 tracking-tight">
            Audit Logs
          </h1>
        </div>

        {/* Filters and Export */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <Input
                type="text"
                placeholder="Search by item or user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-16 text-lg glass-effect border-0 shadow-lg"
              />
            </div>
            
            <Button
              onClick={exportToCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-8"
              size="lg"
            >
              <Download className="mr-2" size={20} />
              <span className="font-bold uppercase">Export CSV</span>
            </Button>
          </div>

          {/* Action Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'TAKE', 'RETURN', 'SET'].map((action) => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={`px-6 py-3 font-semibold uppercase tracking-wide transition-all ${
                  actionFilter === action
                    ? 'bg-columbia-navy text-white shadow-lg'
                    : 'bg-white text-columbia-navy border-2 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="glass-effect p-6 text-center border-l-4 border-blue-600">
            <div className="text-3xl font-bold text-blue-600">{logs.length}</div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Total Actions</div>
          </div>
          <div className="glass-effect p-6 text-center border-l-4 border-red-600">
            <div className="text-3xl font-bold text-red-600">
              {logs.filter(l => l.action === 'TAKE').length}
            </div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Items Taken</div>
          </div>
          <div className="glass-effect p-6 text-center border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-500">
              {logs.filter(l => l.action === 'RETURN').length}
            </div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Items Returned</div>
          </div>
          <div className="glass-effect p-6 text-center border-l-4 border-purple-600">
            <div className="text-3xl font-bold text-purple-600">
              {logs.filter(l => l.action === 'SET').length}
            </div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Inventory Checks</div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="glass-effect overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Date/Time
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Item
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Before
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">
                      After
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-columbia-navy">
                        {log.user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                            log.action === 'TAKE'
                              ? 'bg-red-600 text-white'
                              : log.action === 'RETURN'
                              ? 'bg-blue-600 text-white'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {log.item.name}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        {log.before}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        {log.after}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-bold ${
                            log.after > log.before
                              ? 'text-green-700 bg-green-100'
                              : log.after < log.before
                              ? 'text-red-700 bg-red-100'
                              : 'text-gray-700 bg-gray-100'
                          }`}
                        >
                          {log.after > log.before && '+'}
                          {log.after - log.before}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Showing count */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing <span className="font-bold text-columbia-navy">{filteredLogs.length}</span> of{' '}
          <span className="font-bold text-columbia-navy">{logs.length}</span> audit logs
        </div>
      </div>
    </div>
  );
}

