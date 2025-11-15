'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  cabinet: string;
  shelf: string;
  unit: string;
  quantity: number;
  minimalBalance: number;
  itemNumber?: string | null;
  vendor?: string | null;
  notes?: string | null;
}

export default function InventoryLevelsPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCabinet, setSelectedCabinet] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cabinets = ['All', 'Left', 'Middle', 'Right', 'Floor', 'Armory'];
  
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCabinet = selectedCabinet === 'All' || item.cabinet === selectedCabinet;
    return matchesSearch && matchesCabinet;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.cabinet]) acc[item.cabinet] = {};
    if (!acc[item.cabinet][item.shelf]) acc[item.cabinet][item.shelf] = [];
    acc[item.cabinet][item.shelf].push(item);
    return acc;
  }, {} as Record<string, Record<string, InventoryItem[]>>);

  const lowStockCount = items.filter(i => i.quantity < i.minimalBalance && i.quantity > 0).length;
  const outOfStockCount = items.filter(i => i.quantity === 0).length;

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

      <div className="pt-24 px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-columbia-navy mb-2 tracking-tight">
            Inventory Levels
          </h1>
          <p className="text-gray-600 text-lg">Read-only stock overview</p>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="glass-effect p-6 text-center border-l-4 border-blue-600">
            <div className="text-4xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Total Items</div>
          </div>
          <div className="glass-effect p-6 text-center border-l-4 border-amber-500">
            <div className="text-4xl font-bold text-amber-600">{lowStockCount}</div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Low Stock</div>
          </div>
          <div className="glass-effect p-6 text-center border-l-4 border-red-600">
            <div className="text-4xl font-bold text-red-600">{outOfStockCount}</div>
            <div className="text-sm text-gray-600 font-medium mt-2 uppercase tracking-wide">Out of Stock</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <Input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 text-lg glass-effect border-0 shadow-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {cabinets.map((cabinet) => (
              <button
                key={cabinet}
                onClick={() => setSelectedCabinet(cabinet)}
                className={`px-6 py-3 font-semibold uppercase tracking-wide transition-all ${
                  selectedCabinet === cabinet
                    ? 'bg-columbia-navy text-white shadow-lg'
                    : 'bg-white text-columbia-navy border-2 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cabinet}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Display */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([cabinet, shelves]) => (
            <div key={cabinet} className="glass-effect p-6 border-l-4 border-columbia-navy">
              <h2 className="text-2xl font-bold text-columbia-navy mb-6 uppercase tracking-wide">
                {cabinet} Cabinet
              </h2>

              {Object.entries(shelves)
                .sort((a, b) => {
                  if (a[0] === 'N/A') return 1;
                  if (b[0] === 'N/A') return -1;
                  return a[0].localeCompare(b[0]);
                })
                .map(([shelf, shelfItems]) => (
                  <div key={shelf} className="mb-6 last:mb-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-blue-500">
                      Shelf {shelf}
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {shelfItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-5 border-l-2 border-gray-300 hover:border-columbia-navy transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-columbia-navy mb-2">{item.name}</h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Unit:</span> {item.unit}</p>
                                {item.itemNumber && <p><span className="font-medium">Item #:</span> {item.itemNumber}</p>}
                                {item.vendor && <p><span className="font-medium">Vendor:</span> {item.vendor}</p>}
                                {item.notes && <p className="text-amber-700"><span className="font-medium">Note:</span> {item.notes}</p>}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current</div>
                                <span
                                  className={`text-2xl font-bold px-5 py-2.5 block ${
                                    item.quantity === 0
                                      ? 'bg-red-600 text-white'
                                      : item.quantity < item.minimalBalance
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  {item.quantity}
                                </span>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Min</div>
                                <span className="text-lg font-semibold text-gray-600 px-4 py-2.5 bg-gray-100 block">
                                  {item.minimalBalance}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


