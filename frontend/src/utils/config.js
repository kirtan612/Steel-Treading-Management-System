/**
 * Frontend configuration with environment variable validation
 */

// API Base URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Validate required environment variables in development
if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_API_URL) {
    console.warn(
      '⚠️  VITE_API_URL is not defined. Using default: http://localhost:5000/api/v1'
    );
  }
}

// Export all configuration
export const config = {
  apiUrl: API_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

export default config;
