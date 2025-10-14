type UserRole = 'Super Admin' | 'Admin' | 'Content Manager' | 'Viewer';

const roleHierarchy: Record<UserRole, number> = {
  'Super Admin': 4,
  'Admin': 3,
  'Content Manager': 2,
  'Viewer': 1,
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canViewUsers = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'Super Admin');
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'Super Admin');
};

export const canManageContent = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'Content Manager');
};

export const canDeleteContent = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'Admin');
};

export const canViewLogs = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'Admin');
};
