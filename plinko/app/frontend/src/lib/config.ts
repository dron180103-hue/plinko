// Runtime configuration
let runtimeConfig: {
  API_BASE_URL: string;
} | null = null;

// Default fallback configuration
const defaultConfig = {
  API_BASE_URL: 'http://127.0.0.1:8000',
};

// Function to load runtime configuration (non-blocking, best-effort)
export async function loadRuntimeConfig(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s max

    const response = await fetch('/api/config', { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        runtimeConfig = await response.json();
      }
    }
  } catch {
    // Silently fail - config is optional
  }
}

// Get current configuration
export function getConfig() {
  if (runtimeConfig) return runtimeConfig;
  if (import.meta.env.VITE_API_BASE_URL) {
    return { API_BASE_URL: import.meta.env.VITE_API_BASE_URL };
  }
  return defaultConfig;
}

export function getAPIBaseURL(): string {
  return getConfig().API_BASE_URL;
}

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};