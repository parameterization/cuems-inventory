'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InventoryItem {
  id: string;
  name: string;
  cabinet: string;
  shelf: string;
  quantity: number;
}

export default function ManageLocationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [targetCabinet, setTargetCabinet] = useState('');
  const [targetShelf, setTargetShelf] = useState('');

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/take-remove');
    }
  }, [session, router]);

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

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(items.map(i => i.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkMove = async () => {
    if (selectedItems.size === 0) {
      alert('No items selected');
      return;
    }

    if (!targetCabinet || !targetShelf) {
      alert('Please select target cabinet and shelf');
      return;
    }

    if (!confirm(`Move ${selectedItems.size} items to ${targetCabinet} Cabinet, Shelf ${targetShelf}?`)) {
      return;
    }

    const updates = Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId);
      return {
        ...item,
        id: itemId,
        cabinet: targetCabinet,
        shelf: targetShelf,
      };
    });

    try {
      const response = await fetch('/api/inventory/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        alert('Items moved successfully!');
        setSelectedItems(new Set());
        await fetchInventory();
      } else {
        alert('Failed to move items');
      }
    } catch (error) {
      console.error('Error moving items:', error);
      alert('Failed to move items');
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.cabinet]) acc[item.cabinet] = {};
    if (!acc[item.cabinet][item.shelf]) acc[item.cabinet][item.shelf] = [];
    acc[item.cabinet][item.shelf].push(item);
    return acc;
  }, {} as Record<string, Record<string, InventoryItem[]>>);

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
            Manage Cabinets & Shelves
          </h1>
          <p className="text-gray-600 text-lg">Reorganize inventory locations</p>
        </div>

        {/* Bulk Move Controls */}
        {selectedItems.size > 0 && (
          <div className="glass-effect p-6 mb-6 border-l-4 border-purple-600 sticky top-20 z-10">
            <h2 className="text-xl font-bold text-columbia-navy mb-4 uppercase tracking-wide">
              {selectedItems.size} Items Selected - Move To:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label className="text-sm font-bold uppercase tracking-wide">Target Cabinet</Label>
                <select
                  value={targetCabinet}
                  onChange={(e) => setTargetCabinet(e.target.value)}
                  className="w-full mt-1 h-12 px-3 border-2 border-gray-300 font-semibold"
                >
                  <option value="">Select Cabinet...</option>
                  <option value="Left">Left</option>
                  <option value="Middle">Middle</option>
                  <option value="Right">Right</option>
                  <option value="Floor">Floor</option>
                  <option value="Armory">Armory</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-bold uppercase tracking-wide">Target Shelf</Label>
                <Input
                  type="text"
                  placeholder="0, 1, 2, N/A..."
                  value={targetShelf}
                  onChange={(e) => setTargetShelf(e.target.value)}
                  className="mt-1 h-12 border-2"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleBulkMove}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <span className="font-bold uppercase">Move Items</span>
                </Button>
                <Button
                  onClick={deselectAll}
                  className="bg-gray-600 hover:bg-gray-700"
                  size="lg"
                >
                  <span className="font-bold uppercase">Clear</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 flex gap-4">
          <Button onClick={selectAll} className="bg-columbia-navy hover:bg-blue-900" size="lg">
            <span className="font-bold uppercase">Select All</span>
          </Button>
          <Button onClick={deselectAll} variant="outline" size="lg">
            <span className="font-bold uppercase">Deselect All</span>
          </Button>
        </div>

        {/* Items by Cabinet and Shelf */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([cabinet, shelves]) => (
            <div key={cabinet} className="glass-effect p-6 border-l-4 border-columbia-navy">
              <h2 className="text-2xl font-bold text-columbia-navy mb-6 uppercase tracking-wide">
                {cabinet} Cabinet ({Object.values(shelves).flat().length} items)
              </h2>

              {Object.entries(shelves)
                .sort((a, b) => {
                  if (a[0] === 'N/A') return 1;
                  if (b[0] === 'N/A') return -1;
                  return a[0].localeCompare(b[0]);
                })
                .map(([shelf, shelfItems]) => (
                  <div key={shelf} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-700 uppercase tracking-wide bg-gray-100 px-4 py-2 border-l-4 border-blue-500">
                        Shelf {shelf} ({shelfItems.length} items)
                      </h3>
                      <Button
                        onClick={() => {
                          const shelfItemIds = shelfItems.map(i => i.id);
                          setSelectedItems(new Set(shelfItemIds));
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <span className="font-bold uppercase text-xs">Select Shelf</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {shelfItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`p-4 border-2 cursor-pointer transition-all ${
                            selectedItems.has(item.id)
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-300 hover:border-columbia-navy'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-columbia-navy">{item.name}</p>
                              <p className="text-sm text-gray-600 mt-1">Qty: {Number(item.quantity)}</p>
                            </div>
                            {selectedItems.has(item.id) && (
                              <div className="w-6 h-6 bg-purple-600 text-white flex items-center justify-center font-bold">
                                ✓
                              </div>
                            )}
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

