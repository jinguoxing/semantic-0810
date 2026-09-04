import { FindDataService } from './FindDataService';
import { MockFindDataService } from './MockFindDataService';
import { HttpFindDataService } from './HttpFindDataService';
import { DisconnectedFindDataService } from './DisconnectedFindDataService';

/**
 * P0-16: Factory to create FindDataService instance based on configuration.
 * Supported modes:
 * - 'mock': MockFindDataService with MOCK_FIXTURE origin tags
 * - 'http': HttpFindDataService with real backend REST/WebSocket calls
 * - 'disconnected': DisconnectedFindDataService returning graceful service disconnected notices
 */
export type FindDataServiceMode = 'mock' | 'http' | 'disconnected';

export function resolveFindDataServiceMode(value?: string): FindDataServiceMode {
  return value === 'mock' || value === 'http' || value === 'disconnected' ? value : 'disconnected';
}

export function createFindDataService(explicitMode?: FindDataServiceMode): FindDataService {
  const mode = explicitMode ?? resolveFindDataServiceMode(import.meta.env.VITE_FIND_DATA_MODE as string | undefined);
  const apiBase = import.meta.env.VITE_FIND_DATA_API_BASE as string;

  if (mode === 'disconnected') {
    return new DisconnectedFindDataService();
  }

  if (mode === 'http' || (apiBase && mode !== 'mock')) {
    return new HttpFindDataService(apiBase || '/api/find-data');
  }

  return new MockFindDataService();
}
