/**
 * EVIDENRA App Configuration
 * Central configuration for version and app settings
 */

export const APP_CONFIG = {
  // Version - UPDATE THIS FOR NEW RELEASES
  VERSION: '1.2.0',
  VERSION_DISPLAY: 'v1.2.0',

  // Product Info
  PRODUCT_NAME: 'EVIDENRA Ultimate',
  PRODUCT_SHORT: 'Ultimate',

  // Trial Settings
  TRIAL_DAYS: 30,

  // Feature Flags
  FEATURES: {
    CLOUD_SYNC: true,
    TEAM_FEATURES: true,
    ADMIN_PANEL: true,
  }
} as const;

// Export individual values for convenience
export const APP_VERSION = APP_CONFIG.VERSION;
export const APP_VERSION_DISPLAY = APP_CONFIG.VERSION_DISPLAY;
export const PRODUCT_NAME = APP_CONFIG.PRODUCT_NAME;
