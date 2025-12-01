'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/EasterEgg';
import { Trash2, Crown, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'PROBIE' | 'DRIVER';
  isSupremeAdmin: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  cabinet: string;
  shelf: string;
  quantity: number;
  minimalBalance: number;
  itemNumber?: string | null;
  vendor?: string | null;
  notes?: string | null;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [moveTargetCabinet, setMoveTargetCabinet] = useState('');
  const [moveTargetShelf, setMoveTargetShelf] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'inventory'>('users');
  const [isLoading, setIsLoading] = useState(true);
  
  // Easter egg state
  const [showCreatorToast, setShowCreatorToast] = useState(false);

  // New User Invite State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('DRIVER');

  // New Inventory Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCabinet, setNewItemCabinet] = useState('Left');
  const [newItemShelf, setNewItemShelf] = useState('0');
  const [newItemUnit, setNewItemUnit] = useState('Unit');
  const [newItemQuantity, setNewItemQuantity] = useState('0');
  const [newItemMinBalance, setNewItemMinBalance] = useState('1');
  const [newItemNumber, setNewItemNumber] = useState('');
  const [newItemVendor, setNewItemVendor] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Cabinet Management
  const [showAddCabinet, setShowAddCabinet] = useState(false);
  const [newCabinetName, setNewCabinetName] = useState('');
  const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null);
  const [editCabinetName, setEditCabinetName] = useState('');

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/take-remove');
    }
  }, [session, router]);

  useEffect(() => {
    fetchUsers();
    fetchInventory();
    fetchCabinets();
  }, []);

  const fetchCabinets = async () => {
    try {
      const response = await fetch('/api/cabinets');
      if (response.ok) {
        const data = await response.json();
        setCabinets(data);
      }
    } catch (error) {
      console.error('Error fetching cabinets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleInviteUser = async () => {
    if (!newUserEmail.trim()) {
      alert('Please enter email');
      return;
    }

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          role: newUserRole,
          tempPassword: 'unused', // Backend generates secure token instead
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([data, ...users]);
        setNewUserEmail('');
        setNewUserRole('DRIVER');
        alert(`Invite sent to ${data.email}! They will receive an email to set their password.`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to invite user');
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      alert('Please enter an item name');
      return;
    }

    try {
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          cabinet: newItemCabinet,
          shelf: newItemShelf,
          unit: newItemUnit,
          quantity: parseFloat(newItemQuantity) || 0,
          minimalBalance: parseFloat(newItemMinBalance) || 1,
          itemNumber: newItemNumber.trim() || null,
          vendor: newItemVendor.trim() || null,
          notes: newItemNotes.trim() || null,
        }),
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems([...items, newItem]);
        alert('Item added successfully!');
        // Reset form
        setNewItemName('');
        setNewItemCabinet('Left');
        setNewItemShelf('0');
        setNewItemUnit('Unit');
        setNewItemQuantity('0');
        setNewItemMinBalance('1');
        setNewItemNumber('');
        setNewItemVendor('');
        setNewItemNotes('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
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

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      alert('No items selected');
      return;
    }

    if (!confirm(`⚠️ PERMANENTLY DELETE ${selectedItems.size} items?\n\nThis will also delete all audit history.\n\nCANNOT BE UNDONE!`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedItems).map(itemId =>
        fetch(`/api/inventory/${itemId}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setItems(items.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      alert(`${selectedItems.size} items deleted`);
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('Failed to delete items');
    }
  };

  const handleBulkMove = async () => {
    if (selectedItems.size === 0) {
      alert('No items selected');
      return;
    }

    if (!moveTargetCabinet || !moveTargetShelf) {
      alert('Select target cabinet and shelf');
      return;
    }

    const updates = Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId);
      return { ...item, id: itemId, cabinet: moveTargetCabinet, shelf: moveTargetShelf };
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
      }
    } catch (error) {
      console.error('Error moving items:', error);
      alert('Failed to move items');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-columbia-navy">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {session && <HamburgerMenu userRole={session.user.role} />}

      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-columbia-navy mb-2 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-gray-600 text-lg">Complete system management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-8 py-4 font-bold uppercase tracking-wide transition-all ${
              activeTab === 'users'
                ? 'bg-columbia-navy text-white shadow-lg'
                : 'bg-white text-columbia-navy border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-8 py-4 font-bold uppercase tracking-wide transition-all ${
              activeTab === 'inventory'
                ? 'bg-columbia-navy text-white shadow-lg'
                : 'bg-white text-columbia-navy border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Inventory Management
          </button>
        </div>

        {/* USER MANAGEMENT TAB */}
        {activeTab === 'users' && (
        <div>
        {/* User Management Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-columbia-navy mb-6 uppercase tracking-wide">
            User Management
          </h2>

          {/* Invite New User */}
          <div className="glass-effect p-6 mb-6 border-l-4 border-green-600">
            <h3 className="text-lg font-bold text-columbia-navy mb-4 uppercase tracking-wide">
              Invite New User
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              User will receive an email with a secure link to set their password.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userEmail" className="text-sm font-bold uppercase tracking-wide">
                  Columbia Email
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="user@columbia.edu or @barnard.edu"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="mt-1 h-12 border-2"
                />
              </div>
              <div>
                <Label className="text-sm font-bold uppercase tracking-wide">Role</Label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full mt-1 h-12 px-3 border-2 border-gray-300 font-semibold"
                >
                  <option value="DRIVER">Driver</option>
                  <option value="PROBIE">Probie</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleInviteUser}
              className="mt-4 w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <span className="font-bold uppercase tracking-wider">Send Invite Email</span>
            </Button>
          </div>

          <div className="glass-effect overflow-hidden">
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-5 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {user.isSupremeAdmin && <Crown className="text-yellow-500" size={24} />}
                    {!user.isSupremeAdmin && user.role === 'ADMIN' && <Shield className="text-blue-500" size={24} />}
                    <div>
                      <p 
                        className="font-semibold text-columbia-navy text-lg select-text cursor-text"
                        onClick={(e) => {
                          if (e.detail === 3 && user.email === 'ps3487@columbia.edu') {
                            setShowCreatorToast(true);
                            setTimeout(() => setShowCreatorToast(false), 5000);
                          }
                        }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.isSupremeAdmin}
                      className="px-4 py-2 border-2 border-gray-300 font-semibold uppercase tracking-wide disabled:opacity-50"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="PROBIE">Probie</option>
                      <option value="DRIVER">Driver</option>
                    </select>

                    {!user.isSupremeAdmin && (
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700"
                        size="icon"
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
        )}

        {/* INVENTORY MANAGEMENT TAB */}
        {activeTab === 'inventory' && (
        <div>
          {/* Manage Cabinets Section */}
          <div className="mb-8">
            <div className="glass-effect p-6 border-l-4 border-blue-600">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-columbia-navy uppercase tracking-wide">
                  Cabinet Locations
                </h3>
                <Button
                  onClick={() => setShowAddCabinet(!showAddCabinet)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <span className="font-bold uppercase text-sm">{showAddCabinet ? 'Cancel' : '+ Add Cabinet'}</span>
                </Button>
              </div>

              {showAddCabinet && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300">
                  <div className="flex gap-3">
                    <Input
                      placeholder="New cabinet name (e.g., Storage Room, Truck 1)"
                      value={newCabinetName}
                      onChange={(e) => setNewCabinetName(e.target.value)}
                      className="flex-1 h-12 border-2"
                    />
                    <Button
                      onClick={async () => {
                        if (!newCabinetName.trim()) return;
                        
                        try {
                          const response = await fetch('/api/cabinets', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newCabinetName.trim() }),
                          });

                          if (response.ok) {
                            await fetchCabinets();
                            setNewCabinetName('');
                            setShowAddCabinet(false);
                            alert('Cabinet added successfully!');
                          } else {
                            const error = await response.json();
                            alert(error.error || 'Failed to add cabinet');
                          }
                        } catch (error) {
                          alert('Failed to add cabinet');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <span className="font-bold uppercase">Add</span>
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {cabinets.map(cabinet => (
                  editingCabinetId === cabinet.id ? (
                    <div key={cabinet.id} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border-2 border-blue-500">
                      <Input
                        value={editCabinetName}
                        onChange={(e) => setEditCabinetName(e.target.value)}
                        className="h-6 w-32 text-xs border font-bold"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/cabinets/${cabinet.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ newName: editCabinetName }),
                            });

                            if (response.ok) {
                              await fetchCabinets();
                              await fetchInventory();
                              setEditingCabinetId(null);
                            } else {
                              const error = await response.json();
                              alert(error.error);
                            }
                          } catch (error) {
                            alert('Failed to rename');
                          }
                        }}
                        className="text-green-600 hover:text-green-700 font-bold text-sm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingCabinetId(null)}
                        className="text-gray-600 hover:text-gray-700 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div key={cabinet.id} className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 hover:border-columbia-navy transition-all">
                      <span className="text-xs font-bold uppercase text-columbia-navy">
                        {cabinet.name}
                      </span>
                      <button
                        onClick={() => {
                          setEditingCabinetId(cabinet.id);
                          setEditCabinetName(cabinet.name);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-bold text-xs"
                        title="Rename"
                      >
                        ✎
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${cabinet.name}"?\n\nItems will NOT be deleted, just the cabinet name.`)) return;
                          
                          try {
                            const response = await fetch(`/api/cabinets/${cabinet.id}`, {
                              method: 'DELETE',
                            });

                            if (response.ok) {
                              await fetchCabinets();
                            } else {
                              const error = await response.json();
                              alert(error.error);
                            }
                          } catch (error) {
                            alert('Failed to delete');
                          }
                        }}
                        className="text-red-600 hover:text-red-700 font-bold"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                💡 Tip: Shelves are created automatically when you assign items to them (0, 1, 2, 3, 4, N/A, or custom names)
              </p>
            </div>
          </div>

          {/* Add New Item Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-columbia-navy mb-6 uppercase tracking-wide">
              Add New Inventory Item
            </h2>

            <div className="glass-effect p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                  <Label htmlFor="itemName" className="text-base font-bold uppercase tracking-wide">
                    Item Name *
                  </Label>
                  <Input
                    id="itemName"
                    type="text"
                    placeholder="e.g., Gauze Pads (4x4)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-bold uppercase tracking-wide">Cabinet *</Label>
                  <select
                    value={newItemCabinet}
                    onChange={(e) => setNewItemCabinet(e.target.value)}
                    className="w-full mt-1 h-14 px-4 text-lg border-2 border-gray-300 font-semibold"
                  >
                    {cabinets.map(cab => (
                      <option key={cab.id} value={cab.name}>{cab.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="shelf" className="text-base font-bold uppercase tracking-wide">
                    Shelf *
                  </Label>
                  <Input
                    id="shelf"
                    type="text"
                    placeholder="0-4 or N/A"
                    value={newItemShelf}
                    onChange={(e) => setNewItemShelf(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>

                <div>
                  <Label htmlFor="unit" className="text-base font-bold uppercase tracking-wide">
                    Unit *
                  </Label>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="e.g., Box, Unit, Pack"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-base font-bold uppercase tracking-wide">
                    Initial Quantity *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="any"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>

                <div>
                  <Label htmlFor="minBalance" className="text-base font-bold uppercase tracking-wide">
                    Minimal Balance *
                  </Label>
                  <Input
                    id="minBalance"
                    type="number"
                    step="any"
                    value={newItemMinBalance}
                    onChange={(e) => setNewItemMinBalance(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>

                <div>
                  <Label htmlFor="itemNumber" className="text-base font-bold uppercase tracking-wide">
                    Item Number
                  </Label>
                  <Input
                    id="itemNumber"
                    type="text"
                    placeholder="e.g., #123456"
                    value={newItemNumber}
                    onChange={(e) => setNewItemNumber(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label htmlFor="vendor" className="text-base font-bold uppercase tracking-wide">
                    Vendor
                  </Label>
                  <Input
                    id="vendor"
                    type="text"
                    placeholder="e.g., McKesson"
                    value={newItemVendor}
                    onChange={(e) => setNewItemVendor(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>

                <div className="lg:col-span-3">
                  <Label htmlFor="notes" className="text-base font-bold uppercase tracking-wide">
                    Notes / Expiry / Details
                  </Label>
                  <Input
                    id="notes"
                    type="text"
                    placeholder="Add expiry dates, conditions, or other notes..."
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    className="mt-1 h-14 text-lg border-2"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddItem}
                className="mt-6 w-full bg-columbia-navy hover:bg-blue-900"
                size="xl"
              >
                <span className="font-bold uppercase tracking-wider">Add Item to Inventory</span>
              </Button>
            </div>
          </div>

          {/* Bulk Operations */}
          {selectedItems.size > 0 && (
            <div className="glass-effect p-6 mb-8 border-l-4 border-purple-600">
              <h2 className="text-xl font-bold text-columbia-navy mb-4 uppercase tracking-wide">
                {selectedItems.size} Items Selected
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-sm font-bold uppercase tracking-wide">Move To Cabinet</Label>
                  <select
                    value={moveTargetCabinet}
                    onChange={(e) => setMoveTargetCabinet(e.target.value)}
                    className="w-full mt-1 h-12 px-3 border-2 border-gray-300 font-semibold"
                  >
                    <option value="">Select...</option>
                    {cabinets.map(cab => (
                      <option key={cab.id} value={cab.name}>{cab.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-bold uppercase tracking-wide">Move To Shelf</Label>
                  <Input
                    placeholder="0, 1, 2..."
                    value={moveTargetShelf}
                    onChange={(e) => setMoveTargetShelf(e.target.value)}
                    className="mt-1 h-12 border-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleBulkMove}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <span className="font-bold uppercase">Move</span>
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleBulkDelete}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Trash2 className="mr-2" size={18} />
                    <span className="font-bold uppercase">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Grid - Organized by Cabinet/Shelf */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-columbia-navy uppercase tracking-wide">
                All Items ({items.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedItems(new Set(items.map(i => i.id)))}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <span className="font-bold uppercase">Select All</span>
                </Button>
                <Button
                  onClick={() => setSelectedItems(new Set())}
                  variant="outline"
                >
                  <span className="font-bold uppercase">Clear</span>
                </Button>
              </div>
            </div>

            {Object.entries(items.reduce((acc, item) => {
              if (!acc[item.cabinet]) acc[item.cabinet] = {};
              if (!acc[item.cabinet][item.shelf]) acc[item.cabinet][item.shelf] = [];
              acc[item.cabinet][item.shelf].push(item);
              return acc;
            }, {} as Record<string, Record<string, InventoryItem[]>>)).map(([cabinet, shelves]) => (
              <div key={cabinet} className="glass-effect p-6 mb-6 border-l-4 border-columbia-navy">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-columbia-navy uppercase tracking-wide">
                    {cabinet} Cabinet
                  </h3>
                  <Button
                    onClick={() => {
                      const cabinetIds = Object.values(shelves).flat().map(i => i.id);
                      const allSelected = cabinetIds.every(id => selectedItems.has(id));
                      
                      if (allSelected) {
                        // Deselect all items in this cabinet
                        const newSelected = new Set(selectedItems);
                        cabinetIds.forEach(id => newSelected.delete(id));
                        setSelectedItems(newSelected);
                      } else {
                        // Select all items in this cabinet
                        const newSelected = new Set(selectedItems);
                        cabinetIds.forEach(id => newSelected.add(id));
                        setSelectedItems(newSelected);
                      }
                    }}
                    size="sm"
                    className={`${
                      Object.values(shelves).flat().every(i => selectedItems.has(i.id))
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <span className="font-bold uppercase text-xs">
                      {Object.values(shelves).flat().every(i => selectedItems.has(i.id)) ? 'Deselect Cabinet' : 'Select Cabinet'}
                    </span>
                  </Button>
                </div>

                {Object.entries(shelves).sort((a, b) => {
                  if (a[0] === 'N/A') return 1;
                  if (b[0] === 'N/A') return -1;
                  return a[0].localeCompare(b[0]);
                }).map(([shelf, shelfItems]) => (
                  <div key={shelf} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2 bg-gray-100 px-4 py-2 border-l-4 border-blue-500">
                      <h4 className="font-bold text-gray-700 uppercase tracking-wide">
                        Shelf {shelf} ({shelfItems.length})
                      </h4>
                      <Button
                        onClick={() => {
                          const shelfIds = shelfItems.map(i => i.id);
                          const allSelected = shelfIds.every(id => selectedItems.has(id));
                          
                          if (allSelected) {
                            // Deselect shelf
                            const newSelected = new Set(selectedItems);
                            shelfIds.forEach(id => newSelected.delete(id));
                            setSelectedItems(newSelected);
                          } else {
                            // Select shelf
                            const newSelected = new Set(selectedItems);
                            shelfIds.forEach(id => newSelected.add(id));
                            setSelectedItems(newSelected);
                          }
                        }}
                        size="sm"
                        className={`h-8 ${
                          shelfItems.every(i => selectedItems.has(i.id))
                            ? 'bg-purple-500 hover:bg-purple-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        <span className="font-bold uppercase text-xs">
                          {shelfItems.every(i => selectedItems.has(i.id)) ? 'Deselect' : 'Select'} Shelf
                        </span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {shelfItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`p-3 border-2 cursor-pointer transition-all ${
                            selectedItems.has(item.id)
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-300 hover:border-columbia-navy'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-columbia-navy text-sm">{item.name}</p>
                              <p className="text-xs text-gray-600 mt-1">Qty: {Number(item.quantity)}</p>
                            </div>
                            {selectedItems.has(item.id) && (
                              <div className="w-5 h-5 bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
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
        )}
      </div>

      <Toast
        message={`Param Sampat\nBuilder of CUEMS Inventory Management\nColumbia EMS '28`}
        show={showCreatorToast}
      />
    </div>
  );
}


