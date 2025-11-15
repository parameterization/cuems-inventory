'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { canDoInventoryCheck } from '@/lib/permissions';

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

type EditedItem = Partial<InventoryItem> & { id: string };

export default function InventoryCheckPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editedItems, setEditedItems] = useState<Record<string, EditedItem>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState<string>('All');

  const isAdmin = session?.user.role === 'ADMIN';

  useEffect(() => {
    if (session && !canDoInventoryCheck(session.user.role)) {
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
        const initial: Record<string, EditedItem> = {};
        data.forEach((item: InventoryItem) => {
          initial[item.id] = { ...item };
        });
        setEditedItems(initial);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (itemId: string, field: keyof InventoryItem, value: any) => {
    // Round to 2 decimal places for quantity and minimalBalance to avoid float precision errors
    let processedValue = value;
    if ((field === 'quantity' || field === 'minimalBalance') && typeof value === 'number') {
      processedValue = Math.round(value * 100) / 100;
    }
    
    setEditedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: processedValue,
      },
    }));
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    const updates = Object.values(editedItems);
    setIsSaving(true);

    try {
      const response = await fetch('/api/inventory/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        alert('Inventory updated successfully!');
        await fetchInventory();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update inventory');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Failed to update inventory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const initial: Record<string, EditedItem> = {};
    items.forEach((item) => {
      initial[item.id] = { ...item };
    });
    setEditedItems(initial);
  };

  const hasChanges = items.some(item => 
    JSON.stringify(item) !== JSON.stringify(editedItems[item.id])
  );

  const cabinets = ['All', 'Left', 'Middle', 'Right', 'Floor', 'Armory'];
  
  const filteredItems = items.filter((item) => {
    const matchesCabinet = selectedCabinet === 'All' || item.cabinet === selectedCabinet;
    return matchesCabinet;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
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
    <div className="min-h-screen pb-32">
      {session && <HamburgerMenu userRole={session.user.role} />}

      <div className="pt-24 px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-columbia-navy mb-2 tracking-tight">
            Inventory Check & Adjust
          </h1>
          <p className="text-gray-600 text-lg">
            {isAdmin ? 'Update quantities and edit all item details' : 'Update quantities after physical count'}
          </p>
        </div>

        {/* Instructions */}
        <div className="glass-effect p-5 mb-6 border-l-4 border-blue-600">
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong className="text-blue-700 uppercase tracking-wide">Instructions:</strong>{' '}
            {isAdmin 
              ? 'As an admin, you can update quantities and edit all item details (expiry dates, vendor info, etc.). Make your changes and submit.'
              : 'Enter the actual quantity for each item based on physical count, then submit all changes at once.'}
          </p>
        </div>

        {/* Cabinet Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
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

        {/* Inventory Form */}
        <div className="space-y-8 mb-8">
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

                    <div className="space-y-4">
                      {shelfItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-5 border-2 border-gray-200 hover:border-columbia-navy transition-all"
                        >
                          <h4 className="text-lg font-bold text-columbia-navy mb-4">{item.name}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Quantity - Everyone can edit */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                Current Quantity
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editedItems[item.id]?.quantity ?? item.quantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  handleFieldChange(item.id, 'quantity', isNaN(val) ? 0 : Math.round(val * 100) / 100);
                                }}
                                className="h-12 text-lg font-bold border-2 border-gray-300"
                              />
                            </div>

                            {/* Minimal Balance - Admin only */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                Minimal Balance
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editedItems[item.id]?.minimalBalance ?? item.minimalBalance}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  handleFieldChange(item.id, 'minimalBalance', isNaN(val) ? 0 : Math.round(val * 100) / 100);
                                }}
                                disabled={!isAdmin}
                                className="h-12 text-lg font-bold border-2 border-gray-300"
                              />
                            </div>

                            {/* Unit - Admin only */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                Unit
                              </label>
                              <Input
                                type="text"
                                value={editedItems[item.id]?.unit ?? item.unit}
                                onChange={(e) => handleFieldChange(item.id, 'unit', e.target.value)}
                                disabled={!isAdmin}
                                className="h-12 text-lg border-2 border-gray-300"
                              />
                            </div>

                            {/* Item Number - Admin only */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                Item #
                              </label>
                              <Input
                                type="text"
                                value={editedItems[item.id]?.itemNumber ?? item.itemNumber ?? ''}
                                onChange={(e) => handleFieldChange(item.id, 'itemNumber', e.target.value || null)}
                                disabled={!isAdmin}
                                className="h-12 text-lg border-2 border-gray-300"
                                placeholder="N/A"
                              />
                            </div>

                            {/* Vendor - Admin only */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                Vendor
                              </label>
                              <Input
                                type="text"
                                value={editedItems[item.id]?.vendor ?? item.vendor ?? ''}
                                onChange={(e) => handleFieldChange(item.id, 'vendor', e.target.value || null)}
                                disabled={!isAdmin}
                                className="h-12 text-lg border-2 border-gray-300"
                                placeholder="N/A"
                              />
                            </div>

                            {/* Notes/Expiry - Admin only */}
                            <div className="md:col-span-2 lg:col-span-3">
                              <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                                Notes / Expiry / Details
                              </label>
                              <Input
                                type="text"
                                value={editedItems[item.id]?.notes ?? item.notes ?? ''}
                                onChange={(e) => handleFieldChange(item.id, 'notes', e.target.value || null)}
                                disabled={!isAdmin}
                                className="h-12 text-lg border-2 border-gray-300"
                                placeholder="Add expiry dates, conditions, or other notes here..."
                              />
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-gray-500 uppercase tracking-wide">
                            Original: {item.quantity} {item.unit}
                            {item.notes && ` | ${item.notes}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-6 left-6 right-6 max-w-6xl mx-auto">
          <div className="glass-effect p-4 border-2 border-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
                size="xl"
                className="bg-white hover:bg-gray-100 text-gray-700 border-2 border-gray-400 hover:border-gray-600 shadow-lg transition-all disabled:opacity-40"
              >
                <span className="font-semibold uppercase tracking-wide">Reset Changes</span>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!hasChanges || isSaving}
                size="xl"
                className="bg-columbia-navy hover:bg-blue-900 shadow-lg hover:shadow-xl transition-all disabled:opacity-40 text-white"
              >
                <span className="font-semibold uppercase tracking-wide">
                  {isSaving ? 'Saving...' : 'Submit All Changes'}
                </span>
              </Button>
            </div>

            {hasChanges && (
              <div className="mt-3 text-center text-sm font-bold text-amber-700 uppercase tracking-wide">
                ⚠️ You have unsaved changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


