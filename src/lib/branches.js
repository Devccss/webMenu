/**
 * Configuración de Sucursales / Locales del Restaurante
 * 
 * Cada sucursal puede tener su propio libro de Google Sheets y su propia URL de Apps Script.
 * Si no se pasa ninguna URL específica en la configuración, se utilizará la variable de entorno por defecto.
 */

export const DEFAULT_LOCAL_ID = 'principal';

export const LOCATIONS_CONFIG = {
  'principal': {
    id: 'principal',
    name: 'Sucursal Principal',
    spreadsheetId: import.meta.env.GOOGLE_SPREADSHEET_ID || '',
    appsScriptUrl: import.meta.env.PUBLIC_GOOGLE_APPS_SCRIPT_URL || import.meta.env.GOOGLE_APPS_SCRIPT_URL || '',
  },
  'centro': {
    id: 'centro',
    name: 'Sucursal Centro',
    spreadsheetId: import.meta.env.GOOGLE_SPREADSHEET_ID_CENTRO || '',
    appsScriptUrl: import.meta.env.GOOGLE_APPS_SCRIPT_URL_CENTRO || '',
  },
  'norte': {
    id: 'norte',
    name: 'Sucursal Norte',
    spreadsheetId: import.meta.env.GOOGLE_SPREADSHEET_ID_NORTE || '',
    appsScriptUrl: import.meta.env.GOOGLE_APPS_SCRIPT_URL_NORTE || '',
  }
};

/**
 * Obtener configuración de una sucursal por su ID o parámetro de URL
 */
export function getBranchConfig(localId) {
  const normalizedId = String(localId || '').trim().toLowerCase();
  if (normalizedId && LOCATIONS_CONFIG[normalizedId]) {
    return LOCATIONS_CONFIG[normalizedId];
  }
  
  // Si se pasa un ID desconocido o no configurado, retornar un objeto dinámico fallback
  return {
    id: normalizedId || DEFAULT_LOCAL_ID,
    name: normalizedId ? `Sucursal ${normalizedId.toUpperCase()}` : LOCATIONS_CONFIG[DEFAULT_LOCAL_ID].name,
    spreadsheetId: LOCATIONS_CONFIG[DEFAULT_LOCAL_ID].spreadsheetId,
    appsScriptUrl: LOCATIONS_CONFIG[DEFAULT_LOCAL_ID].appsScriptUrl
  };
}
