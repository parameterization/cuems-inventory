type UserRole = 'ADMIN' | 'PROBIE' | 'DRIVER';

export const canTakeItems = (role: UserRole): boolean => {
  return role === 'ADMIN' || role === 'PROBIE' || role === 'DRIVER';
};

export const canReturnItems = (role: UserRole): boolean => {
  return role === 'ADMIN' || role === 'PROBIE' || role === 'DRIVER';
};

export const canViewInventory = (role: UserRole): boolean => {
  return role === 'ADMIN' || role === 'PROBIE' || role === 'DRIVER';
};

export const canDoInventoryCheck = (role: UserRole): boolean => {
  return role === 'ADMIN' || role === 'PROBIE';
};

export const canManageUsers = (role: UserRole): boolean => {
  return role === 'ADMIN';
};

export const canManageInventory = (role: UserRole): boolean => {
  return role === 'ADMIN';
};


