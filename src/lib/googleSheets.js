import Papa from 'papaparse';

// Google Sheets CSV Export URLs
const SPREADSHEET_ID = import.meta.env.GOOGLE_SPREADSHEET_ID;
const SHEET_MENU_NAME = import.meta.env.GOOGLE_SHEET_MENU_NAME || 'Platos';
const SHEET_CATEGORIES_NAME = import.meta.env.GOOGLE_SHEET_CATEGORIES_NAME || 'Categorias';

// Mock data to fallback to if spreadsheet is not set up yet
const MOCK_CATEGORIES = [
  { id: 'entradas', name: 'Entradas', icon: '🥟', order: 1 },
  { id: 'burgers', name: 'Hamburguesas', icon: '🍔', order: 2 },
  { id: 'postres', name: 'Postres', icon: '🍰', order: 3 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 4 }
];

const MOCK_ITEMS = [
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
    isAvailable: false // Out of stock to show disabled visual
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

/**
 * Fetch and parse data from a specific Google Sheet tab
 */
async function fetchSheetData(sheetName) {
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SPREADSHEET_ID is not configured in environment variables.');
  }

  // Construct Google Sheets export URL for CSV
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error fetching sheet "${sheetName}":`, error);
    throw error;
  }
}

/**
 * Get Categories
 */
export async function getCategories() {
  try {
    if (!SPREADSHEET_ID) {
      console.log('Using mock categories (GOOGLE_SPREADSHEET_ID not defined)');
      return MOCK_CATEGORIES;
    }
    const rawData = await fetchSheetData(SHEET_CATEGORIES_NAME);
    
    // Format categories
    return rawData.map(row => ({
      id: String(row.id || '').trim().toLowerCase(),
      name: String(row.name || '').trim(),
      icon: String(row.icon || '').trim(),
      order: parseInt(row.order) || 99
    })).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.warn('Falling back to mock categories due to error:', error.message);
    return MOCK_CATEGORIES;
  }
}

/**
 * Get Menu Items
 */
export async function getMenuItems() {
  try {
    if (!SPREADSHEET_ID) {
      console.log('Using mock menu items (GOOGLE_SPREADSHEET_ID not defined)');
      return MOCK_ITEMS;
    }
    const rawData = await fetchSheetData(SHEET_MENU_NAME);
    
    // Format items
    return rawData.map(row => ({
      id: String(row.id || '').trim(),
      name: String(row.name || '').trim(),
      description: String(row.description || '').trim(),
      price: parseFloat(row.price) || 0,
      imageUrl: String(row.imageUrl || '').trim(),
      categoryId: String(row.categoryId || '').trim().toLowerCase(),
      isRecommended: String(row.isRecommended || '').trim().toLowerCase() === 'true',
      isAvailable: String(row.isAvailable || '').trim().toLowerCase() !== 'false' // default to true unless explicitly 'false'
    }));
  } catch (error) {
    console.warn('Falling back to mock menu items due to error:', error.message);
    return MOCK_ITEMS;
  }
}
