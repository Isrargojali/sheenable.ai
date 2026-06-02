// she-enable-ai-backend/src/config/env.js
const requiredVars = [
  'JWT_SECRET',
  'FROM_EMAIL',
  'FRONTEND_URL'
];

const validateEnv = () => {
  const missing = [];
  for (const v of requiredVars) {
    if (!process.env[v]) {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    console.error(`\n❌ FATAL CONFIG ERROR: Missing critical environment variables: ${missing.join(', ')}\n`);
    process.exit(1);
  }
};

module.exports = { validateEnv };
