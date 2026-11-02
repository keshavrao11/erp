export type ActionCode = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT';

export type ModuleCode = 
  | 'DASHBOARD' | 'CRM' | 'PROJECTS' | 'CONSTRUCTION' | 'INTERIORS'
  | 'LAND_DEVELOPMENT' | 'PROCUREMENT' | 'INVENTORY' | 'ACCOUNTS' | 'HR'
  | 'REPORTS' | 'DOCUMENTS' | 'MASTERS' | 'USERS' | 'SETTINGS';

export const ALL_MODULES: ModuleCode[] = [
  'DASHBOARD', 'CRM', 'PROJECTS', 'CONSTRUCTION', 'INTERIORS',
  'LAND_DEVELOPMENT', 'PROCUREMENT', 'INVENTORY', 'ACCOUNTS', 'HR',
  'REPORTS', 'DOCUMENTS', 'MASTERS', 'USERS', 'SETTINGS'
];

export const DEPARTMENT_MODULE_MAP: Record<string, ModuleCode[]> = {
  SALES: ['DASHBOARD', 'CRM', 'MASTERS', 'DOCUMENTS'],
  PURCHASE: ['DASHBOARD', 'PROCUREMENT', 'MASTERS', 'DOCUMENTS'],
  ACCOUNTS: ['DASHBOARD', 'ACCOUNTS', 'REPORTS', 'MASTERS', 'DOCUMENTS'],
  HR: ['DASHBOARD', 'HR', 'USERS', 'DOCUMENTS'],
  INVENTORY: ['DASHBOARD', 'INVENTORY', 'MASTERS', 'DOCUMENTS'],
  OPERATIONS: ['DASHBOARD', 'PROJECTS', 'CONSTRUCTION', 'INTERIORS', 'LAND_DEVELOPMENT', 'DOCUMENTS'],
};

export const ROUTE_MODULE_MAP: Record<string, ModuleCode> = {
  '/crm': 'CRM',
  '/projects': 'PROJECTS',
  '/construction': 'CONSTRUCTION',
  '/interiors': 'INTERIORS',
  '/land-development': 'LAND_DEVELOPMENT',
  '/procurement': 'PROCUREMENT',
  '/inventory': 'INVENTORY',
  '/accounts': 'ACCOUNTS',
  '/hr': 'HR',
  '/reports': 'REPORTS',
  '/documents': 'DOCUMENTS',
  '/masters': 'MASTERS',
  '/users': 'USERS',
  '/settings': 'SETTINGS',
};

export const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export function getAllowedModulesForUser(
  roles: string[] = [],
  departmentCode?: string,
  departmentOverride?: string
): ModuleCode[] {
  if (roles.includes('SUPER_ADMIN')) {
    if (departmentOverride && departmentOverride !== 'ALL' && DEPARTMENT_MODULE_MAP[departmentOverride]) {
      return DEPARTMENT_MODULE_MAP[departmentOverride];
    }
    return ALL_MODULES;
  }

  if (departmentCode && DEPARTMENT_MODULE_MAP[departmentCode]) {
    return DEPARTMENT_MODULE_MAP[departmentCode];
  }

  // Fallback by role
  if (roles.includes('CRM')) return DEPARTMENT_MODULE_MAP.SALES;
  if (roles.includes('PURCHASE_EXECUTIVE')) return DEPARTMENT_MODULE_MAP.PURCHASE;
  if (roles.includes('ACCOUNTANT')) return DEPARTMENT_MODULE_MAP.ACCOUNTS;
  if (roles.includes('HR_ADMIN')) return DEPARTMENT_MODULE_MAP.HR;
  if (roles.includes('INVENTORY_MANAGER')) return DEPARTMENT_MODULE_MAP.INVENTORY;
  if (roles.includes('PROJECT_MANAGER') || roles.includes('SITE_ENGINEER') || roles.includes('INTERIOR_DESIGNER') || roles.includes('LAND_DEV_MANAGER')) {
    return DEPARTMENT_MODULE_MAP.OPERATIONS;
  }

  return ['DASHBOARD'];
}

