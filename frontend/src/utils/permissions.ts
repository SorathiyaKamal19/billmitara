import { ModulePermission, Role, User } from '../types';

type StaffRole = Exclude<Role, 'owner' | 'superadmin'>;

export const legacyRolePermissions: Record<StaffRole, ModulePermission[]> = {
  manager: ['tables', 'orders', 'parcel', 'kitchen', 'billing', 'customers'],
  waiter: ['tables', 'orders', 'parcel', 'kitchen'],
  chef: ['kitchen']
};

export const orderedPermissions: ModulePermission[] = [
  'tables',
  'orders',
  'parcel',
  'kitchen',
  'billing',
  'menu',
  'reports',
  'customers',
  'settings',
  'staff'
];

export function hasModulePermission(user: User | null | undefined, permission?: ModulePermission) {
  if (!permission) return true;
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'superadmin') return true;
  if (Array.isArray(user.permissions)) return user.permissions.includes(permission);
  return legacyRolePermissions[user.role as StaffRole]?.includes(permission) || false;
}

export function defaultPermissionsForRole(role: Role): ModulePermission[] {
  if (role === 'owner' || role === 'superadmin') return [];
  return legacyRolePermissions[role] || [];
}

export function firstAccessiblePath(user: User | null | undefined) {
  if (!user) return '/login';
  if (user.role === 'superadmin') return '/superadmin';
  if (user.role === 'owner') return '/';

  const paths: Partial<Record<ModulePermission, string>> = {
    tables: '/tables',
    orders: '/orders',
    parcel: '/parcel',
    kitchen: '/kitchen',
    menu: '/menu',
    reports: '/reports',
    customers: '/customers',
    settings: '/settings',
    staff: '/staff'
  };

  const firstPermission = orderedPermissions.find((permission) => hasModulePermission(user, permission));
  return firstPermission ? paths[firstPermission] || '/profile' : '/profile';
}
