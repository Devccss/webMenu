import Papa from 'papaparse';

// Default Mock Data for immediate visual display if no backend is configured yet
export const MOCK_CATEGORIES = [
  { id: 'entradas', name: 'Entradas', icon: '🥟', order: 1 },
  { id: 'burgers', name: 'Hamburguesas', icon: '🍔', order: 2 },
  { id: 'postres', name: 'Postres', icon: '🍰', order: 3 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 4 }
];

export const MOCK_ITEMS = [
  {
    id: 'e1',
    name: 'Papas Rústicas Cheddar',
    description: 'Papas fritas rústicas crujientes con salsa de queso cheddar fundido, panceta crujiente y cebolla de verdeo picada.',
    price: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
    categoryId: 'entradas',
    isRecommended: true,
    isAvailable: true
  },
  {
    id: 'e2',
    name: 'Tequeños de Queso',
    description: '6 bastones de masa crujiente rellenos de queso llanero fundido, acompañados de salsa alioli casera.',
    price: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=80',
    categoryId: 'entradas',
    isRecommended: false,
    isAvailable: true
  },
  {
    id: 'b1',
    name: 'Doble Cheeseburger',
    description: 'Dos medallones de carne seleccionada de 120g, doble queso cheddar, cebolla caramelizada y aderezo secreto en pan de papa.',
    price: 3800,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    categoryId: 'burgers',
    isRecommended: true,
    isAvailable: true
  },
  {
    id: 'b2',
    name: 'Royale Burger',
    description: 'Medallón de carne 120g, queso cheddar, panceta ahumada, huevo frito, lechuga, tomate y mayonesa casera.',
    price: 4100,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
    categoryId: 'burgers',
    isRecommended: false,
    isAvailable: true
  },
  {
    id: 'b3',
    name: 'Veggie Trufa',
    description: 'Medallón vegetariano de lentejas y portobello, provolone, champiñones salteados, rúcula y mayonesa de trufa.',
    price: 3600,
    imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=500&auto=format&fit=crop&q=80',
    categoryId: 'burgers',
    isRecommended: false,
    isAvailable: false
  },
  {
    id: 'p1',
    name: 'Volcán de Chocolate',
    description: 'Bizcocho tibio de chocolate amargo con centro líquido fundido, acompañado de una bocha de helado de crema americana.',
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
    categoryId: 'postres',
    isRecommended: true,
    isAvailable: true
  },
  {
    id: 'd1',
    name: 'Limonada de Menta y Jengibre',
    description: 'Limonada fresca exprimida en el momento con menta fresca, jengibre rallado y almíbar de caña.',
    price: 800,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
    categoryId: 'bebidas',
    isRecommended: false,
    isAvailable: true
  },
  {
    id: 'd2',
    name: 'Cerveza Patagonia IPA 24.7',
    description: 'Pinta tirada helada, una cerveza session IPA aromática con agregado de sauco silvestre.',
    price: 1100,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&auto=format&fit=crop&q=80',
    categoryId: 'bebidas',
    isRecommended: false,
    isAvailable: true
  }
];

export const DEFAULT_PROFILE = {
  name: 'Bistró & Co.',
  subtitle: 'Sabores artesanales • Carta Digital',
  logoUrl: '',
  accentColor: '#e63946',
  address: 'Av. Principal 1234',
  phone: '+54 11 4321-5678',
  whatsapp: '5491143215678',
  instagram: '@bistroandco',
  openingHours: 'Lunes a Domingo: 12:00 hs a 00:00 hs'
};

/**
 * Obtener datos completos de la sucursal (Perfil, Categorías y Platos) vía Apps Script REST API o CSV Fallback
 */
export async function getBranchMenuData(branchConfig = {}) {
  const { appsScriptUrl, spreadsheetId, name: configName } = branchConfig;

  const baseProfile = {
    ...DEFAULT_PROFILE,
    name: configName || DEFAULT_PROFILE.name
  };

  // 1. Intentar consultar directamente la REST API del Apps Script de la sucursal
  if (appsScriptUrl) {
    try {
      const response = await fetch(appsScriptUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.categories) && Array.isArray(data.items)) {
          const profile = {
            ...baseProfile,
            ...(data.profile || {})
          };
          return {
            profile,
            categories: data.categories,
            items: data.items,
            source: 'rest_api'
          };
        }
      }
    } catch (err) {
      console.warn('No se pudo obtener datos vía Apps Script REST API:', err.message);
    }
  }

  // 2. Fallback a exportación CSV pública de Google Sheets
  if (spreadsheetId) {
    try {
      const [profileRows, categories, items] = await Promise.all([
        fetchSheetCsv(spreadsheetId, 'Perfil').catch(() => []),
        fetchSheetCsv(spreadsheetId, 'Categorias'),
        fetchSheetCsv(spreadsheetId, 'Platos')
      ]);

      const csvProfile = {};
      if (Array.isArray(profileRows)) {
        profileRows.forEach(row => {
          const key = String(row.key || row.Clave || row.Key || row[0] || '').trim();
          const val = String(row.value || row.Valor || row.Value || row[1] || '').trim();
          if (key) csvProfile[key] = val;
        });
      }

      const profile = {
        ...baseProfile,
        ...csvProfile
      };

      const formattedCategories = categories.map(row => ({
        id: String(row.id || '').trim().toLowerCase(),
        name: String(row.name || '').trim(),
        icon: String(row.icon || '').trim(),
        order: parseInt(row.order) || 99
      })).sort((a, b) => a.order - b.order);

      const formattedItems = items.map(row => ({
        id: String(row.id || '').trim(),
        name: String(row.name || '').trim(),
        description: String(row.description || '').trim(),
        price: parseFloat(row.price) || 0,
        imageUrl: String(row.imageUrl || row.imageurl || '').trim(),
        categoryId: String(row.categoryId || row.categoryid || '').trim().toLowerCase(),
        isRecommended: String(row.isRecommended || row.isrecommended).toLowerCase() === 'true',
        isAvailable: String(row.isAvailable || row.isavailable).toLowerCase() !== 'false'
      }));

      return {
        profile,
        categories: formattedCategories.length > 0 ? formattedCategories : MOCK_CATEGORIES,
        items: formattedItems.length > 0 ? formattedItems : MOCK_ITEMS,
        source: 'csv'
      };
    } catch (err) {
      console.warn('Error al leer CSV público de Google Sheets:', err.message);
    }
  }

  // 3. Fallback a Mock Data
  return {
    profile: baseProfile,
    categories: MOCK_CATEGORIES,
    items: MOCK_ITEMS,
    source: 'mock'
  };
}

/**
 * Auxiliar para descargar CSV desde Google Sheets
 */
async function fetchSheetCsv(spreadsheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err)
    });
  });
}

/**
 * Mantenemos compatibilidad con métodos legacy getCategories y getMenuItems
 */
export async function getCategories() {
  const data = await getBranchMenuData({});
  return data.categories;
}

export async function getMenuItems() {
  const data = await getBranchMenuData({});
  return data.items;
}

