import { Client } from "langsmith";

// Initialize LangSmith client for tracing
export function initializeLangSmith() {
  // Check if LangSmith environment variables are set
  if (!process.env.LANGSMITH_API_KEY) {
    console.warn('⚠️ LangSmith API key not configured. Tracing will be disabled.');
    return null;
  }

  try {
    const client = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      endpoint: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
    });

    // Set project name
    if (process.env.LANGSMITH_PROJECT) {
      process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT;
    }

    // Enable tracing v2
    if (process.env.LANGSMITH_TRACING_V2 === 'true') {
      process.env.LANGCHAIN_TRACING_V2 = 'true';
    }

    console.log('✅ LangSmith tracing initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize LangSmith:', error);
    return null;
  }
}

// Export environment variables for LangChain
export const LANGCHAIN_CONFIG = {
  apiKey: process.env.LANGSMITH_API_KEY,
  endpoint: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
  project: process.env.LANGSMITH_PROJECT || "partimeas",
  tracingV2: process.env.LANGSMITH_TRACING_V2 === 'true',
}; 