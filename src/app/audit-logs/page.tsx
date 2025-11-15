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
  batchId?: string | null;
}

interface InventoryCheckBatch {
  batchId: string;
  user: string;
  timestamp: string;
  logs: AuditLog[];
  changedCount: number;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [inventoryChecks, setInventoryChecks] = useState<InventoryCheckBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

    // Group SET actions by batchId for inventory checks
    const batches = new Map<string, AuditLog[]>();
    filtered.forEach(log => {
      if (log.action === 'SET' && log.batchId) {
        if (!batches.has(log.batchId)) {
          batches.set(log.batchId, []);
        }
        batches.get(log.batchId)!.push(log);
      }
    });

    const batchData: InventoryCheckBatch[] = Array.from(batches.entries()).map(([batchId, batchLogs]) => {
      const changedItems = batchLogs.filter(log => log.before !== log.after);
      return {
        batchId,
        user: batchLogs[0].user.email,
        timestamp: batchLogs[0].timestamp,
        logs: batchLogs.sort((a, b) => {
          // Changed items first
          const aChanged = a.before !== a.after ? 0 : 1;
          const bChanged = b.before !== b.after ? 0 : 1;
          if (aChanged !== bChanged) return aChanged - bChanged;
          return a.item.name.localeCompare(b.item.name);
        }),
        changedCount: changedItems.length,
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setInventoryChecks(batchData);
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

  const getFilteredLogsForExport = () => {
    let logsToExport = filteredLogs;

    if (dateRange === 'CUSTOM' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire end date
      
      logsToExport = logsToExport.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    } else if (dateRange !== 'ALL') {
      const now = new Date();
      const rangeStart = new Date();
      
      switch (dateRange) {
        case 'TODAY':
          rangeStart.setHours(0, 0, 0, 0);
          break;
        case 'WEEK':
          rangeStart.setDate(now.getDate() - 7);
          break;
        case 'MONTH':
          rangeStart.setMonth(now.getMonth() - 1);
          break;
        case '3MONTHS':
          rangeStart.setMonth(now.getMonth() - 3);
          break;
      }
      
      logsToExport = logsToExport.filter(log => new Date(log.timestamp) >= rangeStart);
    }

    return logsToExport;
  };

  const exportToCSV = () => {
    const logsToExport = getFilteredLogsForExport();
    
    const headers = ['Date/Time', 'User', 'Action', 'Item', 'Before', 'After', 'Change'];
    const rows = logsToExport.map(log => [
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
    const dateLabel = dateRange === 'ALL' ? 'all' : dateRange === 'CUSTOM' ? `${startDate}-to-${endDate}` : dateRange.toLowerCase();
    a.download = `cuems-audit-log-${dateLabel}-${new Date().toISOString().split('T')[0]}.csv`;
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

          {/* Date Range Export Options */}
          <div className="glass-effect p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Export Date Range:
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 font-semibold text-sm uppercase tracking-wide"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today Only</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
                <option value="3MONTHS">Last 3 Months</option>
                <option value="CUSTOM">Custom Range</option>
              </select>

              {dateRange === 'CUSTOM' && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40 h-10 border-2"
                    placeholder="Start date"
                  />
                  <span className="text-gray-500 font-bold">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40 h-10 border-2"
                    placeholder="End date"
                  />
                </>
              )}
            </div>
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
              {inventoryChecks.length}
            </div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Inventory Checks</div>
          </div>
        </div>

        {/* Audit Logs Display */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="glass-effect text-center py-16 text-gray-500">
              <p className="text-xl">No audit logs found</p>
            </div>
          ) : (
            <>
              {/* Inventory Check Batches */}
              {inventoryChecks.map((batch) => (
                <div key={batch.batchId} className="glass-effect border-l-4 border-purple-600">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedBatches);
                      if (newExpanded.has(batch.batchId)) {
                        newExpanded.delete(batch.batchId);
                      } else {
                        newExpanded.add(batch.batchId);
                      }
                      setExpandedBatches(newExpanded);
                    }}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-purple-50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{expandedBatches.has(batch.batchId) ? '📂' : '📁'}</span>
                      <div className="text-left">
                        <div className="font-bold text-lg text-purple-700 uppercase tracking-wide">
                          Inventory Check
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(batch.timestamp).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} • {batch.user}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-700">{batch.changedCount}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Items Changed</div>
                      </div>
                      <div className="text-2xl text-gray-400">{expandedBatches.has(batch.batchId) ? '▼' : '▶'}</div>
                    </div>
                  </button>

                  {expandedBatches.has(batch.batchId) && (
                    <div className="border-t-2 border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                                Item
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                                Before
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                                After
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                                Change
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {batch.logs.map((log) => (
                              <tr
                                key={log.id}
                                className={`hover:bg-purple-50 transition-colors ${
                                  log.before !== log.after ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                                }`}
                              >
                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                  {log.item.name}
                                  {log.before !== log.after && (
                                    <span className="ml-2 text-xs font-bold text-yellow-700 bg-yellow-200 px-2 py-1 uppercase">Changed</span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                  {log.before}
                                </td>
                                <td className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                  {log.after}
                                </td>
                                <td className="px-6 py-3 text-center">
                                  {log.before !== log.after ? (
                                    <span
                                      className={`inline-block px-3 py-1 text-sm font-bold ${
                                        log.after > log.before
                                          ? 'text-green-700 bg-green-100'
                                          : 'text-red-700 bg-red-100'
                                      }`}
                                    >
                                      {log.after > log.before && '+'}
                                      {log.after - log.before}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-sm">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Individual TAKE/RETURN Actions */}
              {filteredLogs.filter(log => log.action !== 'SET' || !log.batchId).length > 0 && (
                <div className="glass-effect overflow-hidden">
                  <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-300">
                    <h3 className="font-bold text-lg text-gray-700 uppercase tracking-wide">
                      Individual Take/Return Actions
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                            Date/Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                            Item
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                            Before
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                            After
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredLogs
                          .filter(log => log.action !== 'SET' || !log.batchId)
                          .map((log) => (
                            <tr
                              key={log.id}
                              className="hover:bg-blue-50 transition-colors"
                            >
                              <td className="px-6 py-3 text-sm text-gray-900 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('en-US', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </td>
                              <td className="px-6 py-3 text-sm font-medium text-columbia-navy">
                                {log.user.email}
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                                    log.action === 'TAKE'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                {log.item.name}
                              </td>
                              <td className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                {log.before}
                              </td>
                              <td className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                {log.after}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <span
                                  className={`inline-block px-3 py-1 text-sm font-bold ${
                                    log.after > log.before
                                      ? 'text-green-700 bg-green-100'
                                      : 'text-red-700 bg-red-100'
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
                </div>
              )}
            </>
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

