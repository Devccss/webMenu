/**
 * GOOGLE APPS SCRIPT - REST API BACKEND MULTI-SUCURSAL PARA CARTA DIGITAL
 * 
 * Instrucciones de instalación para cada Libro de Sucursal:
 * 1. Abre el Google Sheet de la sucursal correspondiente.
 * 2. Ve a Extensiones > Apps Script.
 * 3. Borra todo el código existente y pega este archivo completo.
 * 4. Configura las credenciales en: Configuración del proyecto > Propiedades del script:
 *    - ADMIN_USER : Nombre de usuario para acceder al panel de esta sucursal (ej: admin)
 *    - ADMIN_PASS : Contraseña para acceder al panel (ej: admin123)
 * 5. Haz clic en "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 6. Selecciona tipo: "Aplicación web".
 * 7. Configuración requerida:
 *    - Ejecutar como: "Tú" (tu correo de Google).
 *    - Quién tiene acceso: "Cualquiera" (necesario para lectura REST pública desde la web).
 * 8. Haz clic en "Implementar" y copia la "URL de la aplicación web".
 * 9. Esa URL es la que usará el panel y la web pública para esta sucursal.
 */

// Credenciales por defecto si no se definen en Propiedades del Script
const DEFAULT_USER = "admin";
const DEFAULT_PASS = "admin123";

const EMPTY_PROFILE = {
  name: "",
  subtitle: "",
  logoUrl: "",
  accentColor: "",
  address: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  openingHours: ""
};

/**
 * Manejador GET: Retorna perfil, categorías y platos guardados en este Google Sheet en formato JSON REST
 */
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    const profile = getProfileData(spreadsheet);
    const categories = getCategoriesData(spreadsheet);
    const items = getMenuItemsData(spreadsheet);

    console.log("[AppsScript] doGet", {
      hasProfileSheet: !!spreadsheet.getSheetByName("Perfil"),
      profileKeys: Object.keys(profile || {}),
      categoriesCount: categories.length,
      itemsCount: items.length
    });
    console.log("[AppsScript] doGet response", JSON.stringify({
      success: true,
      profileKeys: Object.keys(profile || {}),
      categoriesCount: categories.length,
      itemsCount: items.length
    }));
    
    return createJsonResponse({
      success: true,
      status: "online",
      profile: profile,
      categories: categories,
      items: items
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "Error al leer datos del libro de Google Sheets: " + error.toString()
    }, 500);
  }
}

/**
 * Manejador POST: Guarda cambios en las pestañas "Perfil", "Categorias" y "Platos" al instante
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: "Petición vacía sin datos." }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    
    // Obtener credenciales de la sucursal
    const scriptProperties = PropertiesService.getScriptProperties();
    const secureUser = scriptProperties.getProperty('ADMIN_USER') || DEFAULT_USER;
    const securePass = scriptProperties.getProperty('ADMIN_PASS') || DEFAULT_PASS;
    
    // Validar credenciales
    if (payload.username !== secureUser || payload.password !== securePass) {
      return createJsonResponse({ 
        success: false, 
        message: "Usuario o contraseña incorrectos para esta sucursal." 
      }, 401);
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Guardar Perfil
    if (payload.profile && typeof payload.profile === 'object') {
      let sheetProf = spreadsheet.getSheetByName("Perfil");
      if (!sheetProf) {
        sheetProf = spreadsheet.insertSheet("Perfil");
      }
      sheetProf.clear();
      sheetProf.getRange(1, 1, 1, 2).setValues([["key", "value"]]);
      
      const profileKeys = Object.keys(payload.profile);
      if (profileKeys.length > 0) {
        const profRows = profileKeys.map(k => [String(k).trim(), String(payload.profile[k] || "").trim()]);
        sheetProf.getRange(2, 1, profRows.length, 2).setValues(profRows);
      }
    }

    // 2. Guardar Categorías
    if (payload.categories && Array.isArray(payload.categories)) {
      let sheetCat = spreadsheet.getSheetByName("Categorias");
      if (!sheetCat) {
        sheetCat = spreadsheet.insertSheet("Categorias");
      }
      sheetCat.clear();
      sheetCat.getRange(1, 1, 1, 4).setValues([["id", "name", "icon", "order"]]);
      
      if (payload.categories.length > 0) {
        const catRows = payload.categories.map(cat => [
          String(cat.id || "").trim(),
          String(cat.name || "").trim(),
          String(cat.icon || "").trim(),
          parseInt(cat.order) || 99
        ]);
        sheetCat.getRange(2, 1, catRows.length, 4).setValues(catRows);
      }
    }
    
    // 3. Guardar Platos
    if (payload.items && Array.isArray(payload.items)) {
      let sheetMenu = spreadsheet.getSheetByName("Platos");
      if (!sheetMenu) {
        sheetMenu = spreadsheet.insertSheet("Platos");
      }
      sheetMenu.clear();
      sheetMenu.getRange(1, 1, 1, 8).setValues([[
        "id", "name", "description", "price", "imageUrl", "categoryId", "isRecommended", "isAvailable"
      ]]);
      
      if (payload.items.length > 0) {
        const itemRows = payload.items.map(item => [
          String(item.id || "").trim(),
          String(item.name || "").trim(),
          String(item.description || "").trim(),
          Number(item.price) || 0,
          String(item.imageUrl || "").trim(),
          String(item.categoryId || "").trim(),
          item.isRecommended ? "true" : "false",
          item.isAvailable ? "true" : "false"
        ]);
        sheetMenu.getRange(2, 1, itemRows.length, 8).setValues(itemRows);
      }
    }
    
    return createJsonResponse({
      success: true,
      message: "Carta y perfil de la sucursal actualizados al instante en Google Sheets."
    });
    
  } catch (error) {
    return createJsonResponse({ 
      success: false, 
      message: "Excepción en el servidor de Apps Script: " + error.toString() 
    }, 500);
  }
}

/**
 * Leer perfil/preferencias de la hoja activa
 */
function getProfileData(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("Perfil");
  console.log("[AppsScript] getProfileData - Found 'Perfil' sheet");
  if (!sheet) return { ...EMPTY_PROFILE };
  
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { ...EMPTY_PROFILE };
  
  const profile = { ...EMPTY_PROFILE };
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const key = String(row[0] || "").trim();
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(profile, key)) {
      profile[key] = String(row[1] || "").trim();
    }
  }
  
  return profile;
}

/**
 * Leer categorías de la hoja activa
 */
function getCategoriesData(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("Categorias");
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const categories = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row.join("").trim()) continue;
    
    const cat = {};
    headers.forEach((h, idx) => cat[h] = row[idx]);
    
    categories.push({
      id: String(cat.id || "").trim().toLowerCase(),
      name: String(cat.name || "").trim(),
      icon: String(cat.icon || "").trim(),
      order: parseInt(cat.order) || 99
    });
  }
  
  return categories.sort((a, b) => a.order - b.order);
}

/**
 * Leer platos de la hoja activa
 */
function getMenuItemsData(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("Platos");
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const items = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row.join("").trim()) continue;
    
    const item = {};
    headers.forEach((h, idx) => item[h] = row[idx]);
    
    items.push({
      id: String(item.id || "").trim(),
      name: String(item.name || "").trim(),
      description: String(item.description || "").trim(),
      price: parseFloat(item.price) || 0,
      imageUrl: String(item.imageurl || item.imageUrl || "").trim(),
      categoryId: String(item.categoryid || item.categoryId || "").trim().toLowerCase(),
      isRecommended: String(item.isrecommended || item.isRecommended).toLowerCase() === 'true',
      isAvailable: String(item.isavailable || item.isAvailable).toLowerCase() !== 'false'
    });
  }
  
  return items;
}

/**
 * Generar respuesta JSON pura compatible con llamadas REST HTTP
 */
function createJsonResponse(data, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

