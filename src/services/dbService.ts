export interface DbStatusResponse {
  connected: boolean;
  isConfigured?: boolean;
  message: string;
  latencyMs?: number;
  timestamp?: string;
  database?: string;
  postgresVersion?: string;
  error?: string;
  code?: string;
  details?: {
    host: string;
    port: string;
    database: string;
    user: string;
  };
}

export interface SampleItem {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface ItemsResponse {
  success: boolean;
  count?: number;
  items?: SampleItem[];
  message?: string;
}

export interface CreateItemResponse {
  success: boolean;
  message: string;
  item?: SampleItem;
}

/**
 * Fetch health status of the backend API
 */
export async function checkBackendHealth(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Checks PostgreSQL database connection status via the backend
 */
export async function fetchDbStatus(baseUrl: string): Promise<DbStatusResponse> {
  try {
    const res = await fetch(`${baseUrl}/api/db/status`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return await res.json();
  } catch (error: any) {
    return {
      connected: false,
      isConfigured: false,
      message: `Cannot reach backend at ${baseUrl}. Ensure backend server is running.`,
      error: error.message || 'Network request failed',
    };
  }
}

/**
 * Fetch items from PostgreSQL database
 */
export async function fetchItems(baseUrl: string): Promise<ItemsResponse> {
  try {
    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch items',
      items: [],
    };
  }
}

/**
 * Insert a new test item into PostgreSQL database
 */
export async function createItem(
  baseUrl: string,
  title: string,
  description: string
): Promise<CreateItemResponse> {
  try {
    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create item',
    };
  }
}
