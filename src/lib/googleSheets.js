import Papa from 'papaparse';

export const DEFAULT_PROFILE = {
  name: '',
  subtitle: '',
  logoUrl: '',
  accentColor: '',
  address: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  openingHours: ''
};

/**
 * Obtener datos completos de la sucursal (Perfil, Categorías y Platos) vía Apps Script REST API o CSV Fallback
 */
export async function getBranchMenuData(branchConfig = {}) {
  const { appsScriptUrl, spreadsheetId } = branchConfig;
  console.log('getBranchMenuData', { appsScriptUrl, spreadsheetId });
  const baseProfile = {
    ...DEFAULT_PROFILE
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
        categories: formattedCategories,
        items: formattedItems,
        source: 'csv'
      };
    } catch (err) {
      console.warn('Error al leer CSV público de Google Sheets:', err.message);
    }
  }

  // 3. Sin datos válidos: devolver estructuras vacías
  return {
    profile: baseProfile,
    categories: [],
    items: [],
    source: 'empty'
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

