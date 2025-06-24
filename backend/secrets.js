require('dotenv').config();

/**
 * Simple secrets module for environment variables
 * This replaces the complex AWS Secrets Manager integration
 */

/**
 * Initialize API keys from environment variables
 * @returns {Promise<{openaiApiKey: string, bflApiKey: string}>}
 */
async function initializeApiKeys() {
  try {
    console.log('Reading API keys from environment variables...');
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const bflApiKey = process.env.BFL_API_KEY;
    
    if (!openaiApiKey || !bflApiKey) {
      throw new Error('API keys not found in environment variables. Please set OPENAI_API_KEY and BFL_API_KEY.');
    }
    
    console.log('API keys loaded successfully from environment variables');
    return { openaiApiKey, bflApiKey };
  } catch (error) {
    console.error('Failed to initialize API keys:', error);
    throw error;
  }
}

module.exports = {
  initializeApiKeys
}; 