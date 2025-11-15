'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/take-remove');
    }
  }, [session, router]);

  useEffect(() => {
    fetchUsers();
    fetchInventory();
  }, []);

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

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${itemName}"? This will also delete all audit history for this item.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
        alert('Item deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
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

      <div className="pt-24 px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-columbia-navy mb-2 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-gray-600 text-lg">Manage users and inventory</p>
        </div>

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
                  placeholder="user@columbia.edu"
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
                      <p className="font-semibold text-columbia-navy text-lg">{user.email}</p>
                      {user.isSupremeAdmin && (
                        <p className="text-xs text-yellow-600 font-bold uppercase">Supreme Admin</p>
                      )}
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

        {/* Add New Inventory Item Section */}
        <div>
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
                  className="mt-2 h-14 text-lg border-2"
                />
              </div>

              <div>
                <Label className="text-base font-bold uppercase tracking-wide">Cabinet *</Label>
                <select
                  value={newItemCabinet}
                  onChange={(e) => setNewItemCabinet(e.target.value)}
                  className="w-full mt-2 h-14 px-4 text-lg border-2 border-gray-300 font-semibold"
                >
                  <option value="Left">Left</option>
                  <option value="Middle">Middle</option>
                  <option value="Right">Right</option>
                  <option value="Floor">Floor</option>
                  <option value="Armory">Armory</option>
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
                  className="mt-2 h-14 text-lg border-2"
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
                  className="mt-2 h-14 text-lg border-2"
                />
              </div>

              <div>
                <Label htmlFor="quantity" className="text-base font-bold uppercase tracking-wide">
                  Initial Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  className="mt-2 h-14 text-lg border-2"
                />
              </div>

              <div>
                <Label htmlFor="minBalance" className="text-base font-bold uppercase tracking-wide">
                  Minimal Balance *
                </Label>
                <Input
                  id="minBalance"
                  type="number"
                  step="0.01"
                  value={newItemMinBalance}
                  onChange={(e) => setNewItemMinBalance(e.target.value)}
                  className="mt-2 h-14 text-lg border-2"
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
                  className="mt-2 h-14 text-lg border-2"
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
                  className="mt-2 h-14 text-lg border-2"
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
                  className="mt-2 h-14 text-lg border-2"
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

          {/* Existing Inventory Items */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-columbia-navy mb-4 uppercase tracking-wide">
              Existing Items ({items.length})
            </h3>
            <div className="glass-effect overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-columbia-navy">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.cabinet} Cabinet, Shelf {item.shelf} • Qty: {item.quantity} • Min: {item.minimalBalance}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="bg-red-600 hover:bg-red-700"
                        size="icon"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


