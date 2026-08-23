const DEFAULT_LOCAL_ID = "";
function resolveBranchEnvValues(localId) {
  switch (String(localId || "").trim().toLowerCase()) {
    case "prueba":
      return {
        spreadsheetId: "",
        appsScriptUrl: ""
      };
    case "cubano":
      return {
        spreadsheetId: "AKfycbw5zIOAN_R0Z6a2bP-1TIDRjIY4zHJAjFMvuQ3U8-LZAwatcFsieZnOWEuI0I0yCW0h",
        appsScriptUrl: "https://script.google.com/macros/s/AKfycbw5zIOAN_R0Z6a2bP-1TIDRjIY4zHJAjFMvuQ3U8-LZAwatcFsieZnOWEuI0I0yCW0h/exec"
      };
    case "norte":
      return {
        spreadsheetId: "",
        appsScriptUrl: ""
      };
    default:
      return {
        spreadsheetId: "",
        appsScriptUrl: ""
      };
  }
}
const LOCATIONS_CONFIG = {
  "prueba": {
    id: "prueba",
    name: "Página de Prueba",
    ...resolveBranchEnvValues("prueba")
  },
  "cubano": {
    id: "cubano",
    name: "Cafe Cubano",
    ...resolveBranchEnvValues("cubano")
  },
  "norte": {
    id: "norte",
    name: "Sucursal Norte",
    ...resolveBranchEnvValues("norte")
  }
};
function getBranchAppsScriptUrl(localId) {
  return resolveBranchEnvValues(localId).appsScriptUrl;
}
function getBranchConfig(localId) {
  const normalizedId = String(localId || "").trim().toLowerCase();
  const defaultConfig = LOCATIONS_CONFIG[DEFAULT_LOCAL_ID] || {};
  if (normalizedId && LOCATIONS_CONFIG[normalizedId]) {
    const config = LOCATIONS_CONFIG[normalizedId];
    return {
      ...config,
      spreadsheetId: config.spreadsheetId || defaultConfig.spreadsheetId || "",
      appsScriptUrl: config.appsScriptUrl || defaultConfig.appsScriptUrl || ""
    };
  }
  return {
    id: normalizedId || DEFAULT_LOCAL_ID,
    name: normalizedId ? `Sucursal ${normalizedId.toUpperCase()}` : defaultConfig.name,
    spreadsheetId: defaultConfig.spreadsheetId || "",
    appsScriptUrl: defaultConfig.appsScriptUrl || ""
  };
}

export { LOCATIONS_CONFIG as L, getBranchConfig as a, getBranchAppsScriptUrl as g };
