import { create } from 'zustand';
import { City } from '../types/City';
import { fetchRegionCities } from '../services/api';

export interface CityState {
  cities: City[];
  selectedCity: City | null;
  filteredCities: City[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  
  // Actions
  setCities: (cities: City[]) => void;
  setSelectedCity: (city: City | null) => void;
  setFilteredCities: (cities: City[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotalCount: (count: number) => void;
  
  // Filters
  filterByRegion: (regionId: string) => void;
  filterByCountry: (countryId: string) => void;
  filterByPopulation: (min: number, max: number) => void;
  resetFilters: () => void;
}

export const useCityStore = create<CityState>((set, get) => ({
  cities: [],
  selectedCity: null,
  filteredCities: [],
  loading: false,
  error: null,
  totalCount: 0,

  setCities: (cities) => set({ cities, filteredCities: cities }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  setFilteredCities: (cities) => set({ filteredCities: cities }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTotalCount: (totalCount) => set({ totalCount }),

  filterByRegion: async (regionCode: string) => {
    const { cities } = get();
    set({ loading: true });
    
    try {
      const response = await fetchRegionCities({
        countryId: cities[0]?.country || '',
        regionCode,
        limit: 20,
        minPopulation: 0
      });
      
      set({ 
        filteredCities: response.data,
        totalCount: response.metadata.totalCount,
        loading: false,
        error: null
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load region cities';
      set({ 
        error: errorMessage,
        loading: false,
        filteredCities: []
      });
    }
  },

  filterByCountry: (countryId) => {
    const { cities } = get();
    const filtered = cities.filter(city => city.country === countryId);
    set({ filteredCities: filtered });
  },

  filterByPopulation: (min, max) => {
    const { cities } = get();
    const filtered = cities.filter(city => {
      const pop = city.population || 0;
      return pop >= min && (max === 0 || pop <= max);
    });
    set({ filteredCities: filtered });
  },

  resetFilters: () => {
    const { cities } = get();
    set({ 
      filteredCities: [], // Reset to empty to show all cities
      totalCount: cities.length,
      selectedCity: null
    });
  }
}));
