import { useState, useEffect } from 'react';
import { OfflineSearchService } from '../services/OfflineSearchService';
import { SearchResult } from '../types/search';

export const useOfflineSearch = (regionId?: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchService = OfflineSearchService.getInstance();

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const searchResults = await searchService.search(query, {
        regionId,
        limit: 15
      });

      setResults(searchResults);
    } catch (err) {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    results,
    isLoading,
    error,
    performSearch
  };
}; 