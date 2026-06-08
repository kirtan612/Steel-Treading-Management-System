/**
 * Environment variable validation on server startup
 * Ensures all required configuration is present before the server starts
 */

const requiredEnvVars = [
  'PORT',
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL',
  'NODE_ENV'
];

function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check for missing required variables
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  });

  // Check JWT secret strength
  if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET.length < 32) {
    warnings.push('JWT_ACCESS_SECRET should be at least 32 characters long for security');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    warnings.push('JWT_REFRESH_SECRET should be at least 32 characters long for security');
  }

  // If variables are missing, exit immediately
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }

  // Success message
  console.log('✅ Environment variables validated successfully');
}

module.exports = validateEnv;
