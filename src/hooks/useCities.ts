import { useState, useEffect } from 'react';
import { City } from '../types/City';
import { ApiError } from '../types/ApiResponse';
import { fetchCities } from '../services/api';
import { useDebounce } from './useDebounce';

interface UseCitiesParams {
  namePrefix?: string;
  limit?: number;
  offset?: number;
  countryIds?: string;
  minPopulation?: number;
  fetchTrigger?: number; // Add this to trigger fetches
}

export function useCities(params: UseCitiesParams) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedNamePrefix = useDebounce(params.namePrefix, 300);

  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchCities({
          ...params,
          namePrefix: debouncedNamePrefix,
        });
        setCities(response.data);
        setTotalCount(response.metadata.totalCount);
      } catch (err) {
        setError(err as ApiError);
      } finally {
        setLoading(false);
      }
    };

    // Only load cities if there's no namePrefix or if it's debounced
    if (!params.namePrefix || params.namePrefix === debouncedNamePrefix) {
      loadCities();
    }
  }, [debouncedNamePrefix, params.fetchTrigger]); // Only depend on namePrefix and fetchTrigger

  return { 
    cities, 
    setCities,  // Add setCities to the return object
    loading, 
    error, 
    totalCount 
  };
}