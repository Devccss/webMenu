/**
 * GOOGLE APPS SCRIPT - API BACKEND PARA CARTA DE RESTAURANTE
 * 
 * Instrucciones de instalación:
 * 1. Abre tu Google Sheet.
 * 2. Ve a Extenciones > Apps Script.
 * 3. Borra todo el código existente y pega este contenido.
 * 4. Configura las variables en el menú de la izquierda: Configuración del proyecto > Propiedades del script.
 *    Agrega las siguientes propiedades:
 *    - ADMIN_USER : Nombre de usuario para acceder al panel (ej: admin)
 *    - ADMIN_PASS : Contraseña para acceder al panel
 *    - GITHUB_TOKEN : Un Personal Access Token (PAT) de tu cuenta de GitHub con permisos de escritura (repo o workflow)
 *    - GITHUB_OWNER : Tu nombre de usuario en GitHub (dueño del repositorio)
 *    - GITHUB_REPO : El nombre de tu repositorio de GitHub (ej: mi-menu-restaurant)
 * 5. Haz clic en "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 6. Selecciona tipo: "Aplicación web".
 * 7. Configura:
 *    - Ejecutar como: "Tú" (tu correo de Google).
 *    - Quién tiene acceso: "Cualquiera".
 * 8. Haz clic en "Implementar". Otorga los permisos solicitados.
 * 9. Copia la "URL de la aplicación web" generada y colócala en tu archivo .env como PUBLIC_GOOGLE_APPS_SCRIPT_URL.
 */

// Configuración básica (por si no configuras las Propiedades del Script)
const DEFAULT_USER = "admin";
const DEFAULT_PASS = "admin123";

/**
 * Manejador de peticiones POST (Crear/Modificar datos y disparar despliegue)
 */
function doPost(e) {
  try {
    // Parsear el JSON recibido
    const payload = JSON.parse(e.postData.contents);
    
    // Obtener credenciales configuradas
    const scriptProperties = PropertiesService.getScriptProperties();
    const secureUser = scriptProperties.getProperty('ADMIN_USER') || DEFAULT_USER;
    const securePass = scriptProperties.getProperty('ADMIN_PASS') || DEFAULT_PASS;
    
    // Validar credenciales
    if (payload.username !== secureUser || payload.password !== securePass) {
      return createJsonResponse({ 
        success: false, 
        message: "Usuario o contraseña incorrectos en el servidor." 
      }, 401);
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. ESCRIBIR CATEGORÍAS
    if (payload.categories && Array.isArray(payload.categories)) {
      let sheetCat = spreadsheet.getSheetByName("Categorias");
      if (!sheetCat) {
        sheetCat = spreadsheet.insertSheet("Categorias");
      }
      sheetCat.clear();
      
      // Escribir cabeceras
      sheetCat.getRange(1, 1, 1, 4).setValues([["id", "name", "icon", "order"]]);
      
      if (payload.categories.length > 0) {
        const catRows = payload.categories.map(cat => [
          cat.id || "",
          cat.name || "",
          cat.icon || "",
          cat.order || 99
        ]);
        sheetCat.getRange(2, 1, catRows.length, 4).setValues(catRows);
      }
    }
    
    // 2. ESCRIBIR PLATOS / MENU
    if (payload.items && Array.isArray(payload.items)) {
      let sheetMenu = spreadsheet.getSheetByName("Platos");
      if (!sheetMenu) {
        sheetMenu = spreadsheet.insertSheet("Platos");
      }
      sheetMenu.clear();
      
      // Escribir cabeceras
      sheetMenu.getRange(1, 1, 1, 8).setValues([[
        "id", "name", "description", "price", "imageUrl", "categoryId", "isRecommended", "isAvailable"
      ]]);
      
      if (payload.items.length > 0) {
        const itemRows = payload.items.map(item => [
          item.id || "",
          item.name || "",
          item.description || "",
          item.price || 0,
          item.imageUrl || "",
          item.categoryId || "",
          item.isRecommended ? "true" : "false",
          item.isAvailable ? "true" : "false"
        ]);
        sheetMenu.getRange(2, 1, itemRows.length, 8).setValues(itemRows);
      }
    }
    
    // 3. DISPARAR REBUILD EN GITHUB ACTIONS
    const githubToken = scriptProperties.getProperty('GITHUB_TOKEN');
    const githubOwner = scriptProperties.getProperty('GITHUB_OWNER');
    const githubRepo = scriptProperties.getProperty('GITHUB_REPO');
    
    let githubTriggered = false;
    let githubMessage = "";
    
    if (githubToken && githubOwner && githubRepo) {
      const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`;
      
      const headers = {
        "Authorization": `token ${githubToken}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GoogleAppsScript-MenuApp"
      };
      
      const requestPayload = JSON.stringify({
        "event_type": "deploy_menu" // Debe coincidir con el workflow de GitHub Actions
      });
      
      const options = {
        "method": "post",
        "headers": headers,
        "payload": requestPayload,
        "contentType": "application/json",
        "muteHttpExceptions": true
      };
      
      const response = UrlFetchApp.fetch(githubUrl, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode === 204 || responseCode === 200 || responseCode === 201) {
        githubTriggered = true;
        githubMessage = "Recompilación de la web iniciada en GitHub Actions.";
      } else {
        githubMessage = `Error al conectar con la API de GitHub: ${response.getContentText()} (Código: ${responseCode})`;
      }
    } else {
      githubMessage = "Variables de GitHub no configuradas en Google Sheets. Los datos se guardaron en la hoja, pero no se disparó la compilación.";
    }
    
    return createJsonResponse({
      success: true,
      message: "Carta actualizada con éxito en Google Sheets.",
      githubRebuild: githubTriggered,
      githubStatus: githubMessage
    });
    
  } catch (error) {
    return createJsonResponse({ 
      success: false, 
      message: "Excepción en el servidor: " + error.toString() 
    }, 500);
  }
}

/**
 * Manejador de peticiones GET (para verificar conexión y obtener estado rápido)
 */
function doGet(e) {
  return createJsonResponse({
    success: true,
    status: "online",
    message: "API de Google Sheets para carta digital activa y lista."
  });
}

/**
 * Helper para generar respuestas JSON compatibles con CORS
 */
function createJsonResponse(data, statusCode = 200) {
  // Nota: Apps Script siempre redirige o responde text/plain, para evitar bloqueos CORS
  // en navegadores estructuramos una salida de texto JSON pura.
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
