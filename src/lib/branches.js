/**
 * Configuración de Sucursales / Locales del Restaurante
 * 
 * Cada sucursal puede tener su propio libro de Google Sheets y su propia URL de Apps Script.
 * Si no se pasa ninguna URL específica en la configuración, se utilizará la variable de entorno por defecto.
 */

export const DEFAULT_LOCAL_ID = '';

function resolveBranchEnvValues(localId) {
  
  switch (String(localId || '').trim().toLowerCase()) {
    case 'prueba':
      return {
        spreadsheetId: import.meta.env.PUBLIC_GOOGLE_SPREADSHEET_ID || import.meta.env.GOOGLE_SPREADSHEET_ID || '',
        appsScriptUrl: import.meta.env.PUBLIC_GOOGLE_APPS_SCRIPT_URL || import.meta.env.GOOGLE_APPS_SCRIPT_URL || ''
      };
    case 'cubano':
      return {
        spreadsheetId: import.meta.env.PUBLIC_CAFECUBANO_SPREADSHEET_ID || import.meta.env.CAFECUBANO_SPREADSHEET_ID || '',
        appsScriptUrl: import.meta.env.PUBLIC_CAFECUBANO_GOOGLE_APPS_SCRIPT_URL || import.meta.env.CAFECUBANO_GOOGLE_APPS_SCRIPT_URL || ''
      };
    case 'norte':
      return {
        spreadsheetId: import.meta.env.PUBLIC_GOOGLE_SPREADSHEET_ID_NORTE || import.meta.env.GOOGLE_SPREADSHEET_ID_NORTE || '',
        appsScriptUrl: import.meta.env.PUBLIC_GOOGLE_APPS_SCRIPT_URL_NORTE || import.meta.env.GOOGLE_APPS_SCRIPT_URL_NORTE || ''
      };
    default:
      return {
        spreadsheetId: '',
        appsScriptUrl: ''
      };
  } 
}

export const LOCATIONS_CONFIG = {
  'prueba': {
    id: 'prueba',
    name: 'Página de Prueba',
    ...resolveBranchEnvValues('prueba'),
  },
  'cubano': {
    id: 'cubano',
    name: 'Cafe Cubano',
    ...resolveBranchEnvValues('cubano'),
  },
  'norte': {
    id: 'norte',
    name: 'Sucursal Norte',
    ...resolveBranchEnvValues('norte'),
  }
};

export function getBranchAppsScriptUrl(localId) {
  return resolveBranchEnvValues(localId).appsScriptUrl;
}

export function getBranchSpreadsheetId(localId) {
  return resolveBranchEnvValues(localId).spreadsheetId;
}


/**
 * Obtener configuración de una sucursal por su ID o parámetro de URL
 */
export function getBranchConfig(localId) {
  const normalizedId = String(localId || '').trim().toLowerCase();
  const defaultConfig = LOCATIONS_CONFIG[DEFAULT_LOCAL_ID] || {};

  if (normalizedId && LOCATIONS_CONFIG[normalizedId]) {
    const config = LOCATIONS_CONFIG[normalizedId];
    return {
      ...config,
      spreadsheetId: config.spreadsheetId || defaultConfig.spreadsheetId || '',
      appsScriptUrl: config.appsScriptUrl || defaultConfig.appsScriptUrl || ''
    };
  }
  
  // Si se pasa un ID desconocido o no configurado, retornar un objeto dinámico fallback con las credenciales base
  return {
    id: normalizedId || DEFAULT_LOCAL_ID,
    name: normalizedId ? `Sucursal ${normalizedId.toUpperCase()}` : defaultConfig.name,
    spreadsheetId: defaultConfig.spreadsheetId || '',
    appsScriptUrl: defaultConfig.appsScriptUrl || ''
  };
}

