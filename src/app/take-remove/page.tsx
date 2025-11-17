'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Search } from 'lucide-react';
import { getPusherClient } from '@/lib/pusher';

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

export default function TakeRemovePage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCabinet, setSelectedCabinet] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInventory();

    // Set up real-time updates
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      try {
        const pusher = getPusherClient();
        const channel = pusher.subscribe('inventory');
        
        channel.bind('pusher:subscription_succeeded', () => {
          console.log('✅ Real-time updates connected');
        });

        channel.bind('pusher:subscription_error', (error: any) => {
          console.error('❌ Real-time connection failed:', error);
        });
        
        channel.bind('item-updated', (updatedItem: InventoryItem) => {
          console.log('📦 Item updated via Pusher:', updatedItem.name);
          setItems(prevItems => 
            prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
          );
        });

        return () => {
          channel.unbind_all();
          pusher.unsubscribe('inventory');
        };
      } catch (error) {
        console.error('Pusher setup error:', error);
      }
    } else {
      console.warn('Pusher not configured - real-time updates disabled');
    }
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

  const handleTake = async (itemId: string) => {
    try {
      const response = await fetch('/api/inventory/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      }
    } catch (error) {
      console.error('Error taking item:', error);
    }
  };

  const handleReturn = async (itemId: string) => {
    try {
      const response = await fetch('/api/inventory/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      }
    } catch (error) {
      console.error('Error returning item:', error);
    }
  };

  const cabinets = ['All', 'Left', 'Middle', 'Right', 'Floor', 'Armory'];
  
  // Easter egg: search for "param"
  const isParamSearch = searchQuery.toLowerCase() === 'param';
  
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCabinet = selectedCabinet === 'All' || item.cabinet === selectedCabinet;
    return matchesSearch && matchesCabinet;
  });

  // Group items by cabinet and shelf
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.cabinet]) acc[item.cabinet] = {};
    if (!acc[item.cabinet][item.shelf]) acc[item.cabinet][item.shelf] = [];
    acc[item.cabinet][item.shelf].push(item);
    return acc;
  }, {} as Record<string, Record<string, InventoryItem[]>>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-columbia-navy">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {session && <HamburgerMenu userRole={session.user.role} />}

      <div className="pt-24 px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-columbia-navy mb-2 tracking-tight">
            Take & Return
          </h1>
          <p className="text-gray-600 text-lg">
            Organized by cabinet and shelf
          </p>
        </div>

        {/* Search and Cabinet Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 text-lg glass-effect border-0 shadow-lg"
            />
          </div>

          {/* Cabinet Filter Buttons */}
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

        {/* Grouped Inventory Display */}
        <div className="space-y-8">
          {/* Easter Egg - Search "param" */}
          {isParamSearch && (
            <div className="glass-effect p-6 border-l-4 border-purple-600">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-columbia-navy">👋 You found the easter egg!</p>
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-columbia-navy">Param Sampat</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>Built this inventory system • Nov 2025</p>
                    <p className="text-columbia-navy font-medium">ps3487@columbia.edu</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current</div>
                    <span className="text-2xl font-bold px-4 py-2 block bg-purple-600 text-white">∞</span>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Min</div>
                    <span className="text-lg font-semibold text-gray-600 px-3 py-2 bg-gray-100 block">1</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="w-full bg-gray-400 text-white px-4 py-3 text-center opacity-50 cursor-not-allowed font-bold uppercase">
                  Can't Take
                </div>
                <div className="w-full bg-gray-400 text-white px-4 py-3 text-center opacity-50 cursor-not-allowed font-bold uppercase">
                  Can't Return
                </div>
              </div>
            </div>
          )}

          {Object.keys(groupedItems).length === 0 && !isParamSearch ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl">No items found</p>
            </div>
          ) : !isParamSearch && (
            Object.entries(groupedItems).map(([cabinet, shelves]) => (
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
                            className="bg-white p-4 border-l-2 border-gray-300 hover:border-columbia-navy transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-columbia-navy">{item.name}</h4>
                                <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                                  <p>Unit: {item.unit}</p>
                                  {item.itemNumber && <p>Item #: {item.itemNumber}</p>}
                                  {item.vendor && <p>Vendor: {item.vendor}</p>}
                                  {item.notes && <p className="text-amber-700">Note: {item.notes}</p>}
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current</div>
                                  <span
                                    className={`text-2xl font-bold px-4 py-2 block ${
                                      Number(item.quantity) === 0
                                        ? 'bg-red-600 text-white'
                                        : Number(item.quantity) < Number(item.minimalBalance)
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-emerald-600 text-white'
                                    }`}
                                  >
                                    {item.quantity}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Min</div>
                                  <span className="text-lg font-semibold text-gray-600 px-3 py-2 bg-gray-100 block">
                                    {item.minimalBalance}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    onClick={() => handleTake(item.id)}
                                    disabled={Number(item.quantity) === 0}
                                size="lg"
                                className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
                              >
                                <Minus className="mr-2" size={20} />
                                <span className="font-bold uppercase">TAKE</span>
                              </Button>

                              <Button
                                onClick={() => handleReturn(item.id)}
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                              >
                                <Plus className="mr-2" size={20} />
                                <span className="font-bold uppercase">RETURN</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


