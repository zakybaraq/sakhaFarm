import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3000';

export const mockUnits = [
  {
    id: 1,
    tenantId: 1,
    name: 'Unit Kuningan',
    code: 'KNG',
    location: 'Kuningan, Jawa Barat',
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    tenantId: 1,
    name: 'Unit Cirebon',
    code: 'CRB',
    location: 'Cirebon, Jawa Barat',
    isDeleted: true,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
];

export const mockPlasmas = [
  {
    id: 1,
    tenantId: 1,
    unitId: 1,
    name: 'Plasma Majasari',
    farmerName: 'Pak Dodi',
    address: 'Majasari, Kuningan',
    phone: '08123456789',
    capacity: 5000,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    tenantId: 1,
    unitId: 1,
    name: 'Plasma Cilimus',
    farmerName: 'Bu Siti',
    address: 'Cilimus, Kuningan',
    phone: '08198765432',
    capacity: 3000,
    isDeleted: true,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

export const mockCycles = [
  {
    id: 1,
    plasmaId: 1,
    cycleNumber: 1,
    docType: 'CP',
    chickInDate: '2026-01-15',
    initialPopulation: 5000,
    status: 'Active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 2,
    plasmaId: 1,
    cycleNumber: 2,
    docType: 'Ross',
    chickInDate: '2026-03-01',
    initialPopulation: 4500,
    status: 'Completed',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
];

export const mockFeedTypes = [
  { id: 1, tenantId: 1, code: 'STARTER', name: 'Starter', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 2, tenantId: 1, code: 'GROWER', name: 'Grower', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 3, tenantId: 1, code: 'FINISHER', name: 'Finisher', isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const mockFeedBrands = [
  { id: 1, tenantId: 1, code: 'CP', name: 'Charoen Pokphand', phone: '021-1234567', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 2, tenantId: 1, code: 'WONO', name: 'Wonokoyo', phone: '031-9876543', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const mockFeedProducts = [
  { id: 1, tenantId: 1, code: 'CP-ST-50', name: 'Super Start 511', typeId: 1, brandId: 1, typeName: 'Starter', brandName: 'Charoen Pokphand', zakKgConversion: '50', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 2, tenantId: 1, code: 'CP-GR-50', name: 'Super Grower 311', typeId: 2, brandId: 1, typeName: 'Grower', brandName: 'Charoen Pokphand', zakKgConversion: '50', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const mockUsers = [
  {
    id: '1',
    email: 'admin@sakha.com',
    name: 'Admin User',
    roleId: 1,
    tenantId: 1,
    status: 'active' as const,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'operator@sakha.com',
    name: 'Operator User',
    roleId: 2,
    tenantId: 1,
    status: 'inactive' as const,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

export const mockUser = {
  id: '1',
  email: 'admin@sakha.com',
  name: 'Admin User',
  roleId: 1,
  tenantId: 1,
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockPermissions = [
  { id: 1, action: 'read', permissionId: 1, permissionName: 'units.read', permissionDescription: 'Read units', permissionCategory: 'units' },
  { id: 2, action: 'write', permissionId: 2, permissionName: 'units.write', permissionDescription: 'Write units', permissionCategory: 'units' },
  { id: 3, action: 'read', permissionId: 3, permissionName: 'plasmas.read', permissionDescription: 'Read plasmas', permissionCategory: 'plasmas' },
  { id: 4, action: 'read', permissionId: 4, permissionName: 'cycles.read', permissionDescription: 'Read cycles', permissionCategory: 'cycles' },
  { id: 5, action: 'read', permissionId: 5, permissionName: 'users.read', permissionDescription: 'Read users', permissionCategory: 'users' },
  { id: 6, action: 'read', permissionId: 6, permissionName: 'inventory.read', permissionDescription: 'Read inventory', permissionCategory: 'inventory' },
  { id: 7, action: 'write', permissionId: 7, permissionName: 'rbac.write', permissionDescription: 'Manage RBAC', permissionCategory: 'rbac' },
];

export const handlers = [
  // Auth endpoints
  http.get(`${BASE_URL}/api/auth/me`, () => {
    return HttpResponse.json({ user: mockUser });
  }),

  http.get(`${BASE_URL}/api/auth/permissions`, () => {
    return HttpResponse.json({ permissions: mockPermissions });
  }),

  http.post(`${BASE_URL}/api/auth/login`, async () => {
    return HttpResponse.json({ success: true, user: { id: mockUser.id, email: mockUser.email, name: mockUser.name } });
  }),

  http.post(`${BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Units endpoints
  http.get(`${BASE_URL}/api/units`, () => {
    return HttpResponse.json({ units: mockUnits });
  }),

  http.post(`${BASE_URL}/api/units`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, unit: { ...mockUnits[0], ...body } });
  }),

  http.put(`${BASE_URL}/api/units/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${BASE_URL}/api/units/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Plasmas endpoints
  http.get(`${BASE_URL}/api/plasmas`, () => {
    return HttpResponse.json({ plasmas: mockPlasmas });
  }),

  http.post(`${BASE_URL}/api/plasmas`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, plasma: { ...mockPlasmas[0], ...body } });
  }),

  http.put(`${BASE_URL}/api/plasmas/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${BASE_URL}/api/plasmas/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Cycles endpoints
  http.get(`${BASE_URL}/api/cycles`, () => {
    return HttpResponse.json({ cycles: mockCycles });
  }),

  http.post(`${BASE_URL}/api/cycles`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, cycle: { ...mockCycles[0], ...body } });
  }),

  http.put(`${BASE_URL}/api/cycles/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${BASE_URL}/api/cycles/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Users endpoints
  http.get(`${BASE_URL}/api/users`, () => {
    return HttpResponse.json({ users: mockUsers });
  }),

  http.put(`${BASE_URL}/api/users/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true });
  }),

  http.patch(`${BASE_URL}/api/users/:id/deactivate`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.patch(`${BASE_URL}/api/users/:id/activate`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Roles endpoints (for RBAC)
  http.get(`${BASE_URL}/api/roles`, () => {
    return HttpResponse.json({
      roles: [
        { id: 1, name: 'Super Admin', description: 'Full access', permissions: mockPermissions, userCount: 1, permissionCount: mockPermissions.length },
        { id: 2, name: 'Operator', description: 'Limited access', permissions: mockPermissions.slice(0, 4), userCount: 1, permissionCount: 4 },
      ],
    });
  }),

  // Feed types endpoints
  http.get(`${BASE_URL}/api/feed-types`, () => {
    return HttpResponse.json({ types: mockFeedTypes });
  }),
  http.post(`${BASE_URL}/api/feed-types`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, type: { ...mockFeedTypes[0], ...body } });
  }),
  http.put(`${BASE_URL}/api/feed-types/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),
  http.patch(`${BASE_URL}/api/feed-types/:id/toggle`, async () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete(`${BASE_URL}/api/feed-types/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Feed brands endpoints
  http.get(`${BASE_URL}/api/feed-brands`, () => {
    return HttpResponse.json({ brands: mockFeedBrands });
  }),
  http.post(`${BASE_URL}/api/feed-brands`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, brand: { ...mockFeedBrands[0], ...body } });
  }),
  http.put(`${BASE_URL}/api/feed-brands/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),
  http.patch(`${BASE_URL}/api/feed-brands/:id/toggle`, async () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete(`${BASE_URL}/api/feed-brands/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Feed products endpoints
  http.get(`${BASE_URL}/api/feed/products`, () => {
    return HttpResponse.json({ products: mockFeedProducts });
  }),
  http.post(`${BASE_URL}/api/feed/products`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, product: { ...mockFeedProducts[0], ...body } });
  }),
  http.put(`${BASE_URL}/api/feed/products/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete(`${BASE_URL}/api/feed/products/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Audit log endpoints
  http.get(`${BASE_URL}/api/audit`, () => {
    return HttpResponse.json({
      logs: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  }),
];