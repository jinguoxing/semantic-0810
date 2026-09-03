import { FindDataService } from './FindDataService';
import { MockFindDataService } from './MockFindDataService';

/**
 * Factory to create FindDataService instance.
 * In a production setup, this would check environment flags or backend endpoints
 * and return HttpFindDataService if backend is configured.
 */
export function createFindDataService(): FindDataService {
  // If backend REST / SSE endpoint is ready:
  // if (import.meta.env.VITE_FIND_DATA_API_BASE) {
  //   return new HttpFindDataService(import.meta.env.VITE_FIND_DATA_API_BASE);
  // }
  return new MockFindDataService();
}
