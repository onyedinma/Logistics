import { OfflineSearchDatabase } from './OfflineSearchDatabase';
import { MapStorageService } from './MapStorageService';
import { geocodeAddress, searchPOIs } from '../api/search';
import { normalizeSearchText } from '../utils/searchUtils';

export class OfflineSearchService {
  private static instance: OfflineSearchService;
  private db: OfflineSearchDatabase;
  private mapStorage: MapStorageService;

  private constructor() {
    this.db = OfflineSearchDatabase.getInstance();
    this.mapStorage = MapStorageService.getInstance();
  }

  static getInstance() {
    if (!OfflineSearchService.instance) {
      OfflineSearchService.instance = new OfflineSearchService();
    }
    return OfflineSearchService.instance;
  }

  async downloadRegionSearchData(regionId: string) {
    try {
      const region = await this.mapStorage.getRegion(regionId);
      if (!region) throw new Error('Region not found');

      // Download address data
      const addresses = await geocodeAddress(region.bounds);
      const normalizedAddresses = addresses.map(addr => ({
        id: `addr-${addr.id}`,
        name: addr.formattedAddress,
        type: 'address' as const,
        latitude: addr.latitude,
        longitude: addr.longitude,
        searchText: normalizeSearchText(addr.formattedAddress),
      }));

      // Download POI data
      const pois = await searchPOIs(region.bounds);
      const normalizedPOIs = pois.map(poi => ({
        id: `poi-${poi.id}`,
        name: poi.name,
        type: 'poi' as const,
        latitude: poi.latitude,
        longitude: poi.longitude,
        searchText: normalizeSearchText(`${poi.name} ${poi.category}`),
      }));

      // Save to database
      await this.db.addItems([...normalizedAddresses, ...normalizedPOIs], regionId);
    } catch (error) {
      console.error('Error downloading search data:', error);
      throw error;
    }
  }

  async search(query: string, options: {
    regionId?: string;
    type?: 'address' | 'poi';
    limit?: number;
  } = {}) {
    const normalizedQuery = normalizeSearchText(query);
    return this.db.search(normalizedQuery, options);
  }
} 