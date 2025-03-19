import { ApiResponse, ApiError, CityDetails } from '../types/ApiResponse';

// API Constants
const API_HOST = 'wft-geo-db.p.rapidapi.com';
const BASE_URL = `https://${API_HOST}/v1/geo`;
const CITIES_ENDPOINT = `${BASE_URL}/cities`;
const DEFAULT_LIMIT = 10;

// API Headers
const getHeaders = () => {
  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  
  if (!apiKey) {
    throw new Error('RapidAPI key is not configured. Please add VITE_RAPIDAPI_KEY to your .env file.');
  }

  return {
    'X-RapidAPI-Host': API_HOST,
    'X-RapidAPI-Key': apiKey,
  };
};

// Add delay helper to handle rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    await delay(RETRY_DELAY); // Always add delay to respect rate limits
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited, retrying in ${RETRY_DELAY * 2}ms... (${retries} retries left)`);
      await delay(RETRY_DELAY * 2);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed, retrying... (${retries} retries left)`);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// API Parameter Types
export interface CitySearchParams {
  namePrefix?: string;
  namePrefixDefaultLangResults?: boolean;
  countryIds?: string;
  regionIds?: string;
  minPopulation?: number;
  maxPopulation?: number;
  types?: string[];
  excludedTypes?: string[];
  nearLocation?: {
    latitude: number;
    longitude: number;
    radius?: number;
  };
  limit?: number;
  offset?: number;
  sort?: string;
}

interface SearchParams {
  namePrefix?: string;
  countryIds?: string;
  minPopulation?: number;
  maxPopulation?: number;
  limit?: number;
}

export const searchCities = async (params: SearchParams) => {
  const queryParams = new URLSearchParams();
  
  if (params.namePrefix) queryParams.append('namePrefix', params.namePrefix);
  if (params.countryIds) queryParams.append('countryIds', params.countryIds);
  if (params.minPopulation && params.minPopulation > 0) {
    queryParams.append('minPopulation', params.minPopulation.toString());
  }
  if (params.maxPopulation && params.maxPopulation > 0) {
    queryParams.append('maxPopulation', params.maxPopulation.toString());
  }
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(
    `${BASE_URL}/cities?${queryParams.toString()}`,
    {
      headers: {
        'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch cities based on search parameters
 */
export async function fetchCities(params: CitySearchParams): Promise<ApiResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.namePrefix) {
    searchParams.append('namePrefix', params.namePrefix);
    if (params.namePrefixDefaultLangResults) {
      searchParams.append('namePrefixDefaultLangResults', 'true');
    }
  }
  
  if (params.countryIds) {
    searchParams.append('countryIds', params.countryIds.toUpperCase());
    searchParams.append('types', 'CITY'); // Always include CITY type when filtering by country
  }
  
  if (params.regionIds) {
    searchParams.append('regionIds', params.regionIds); // Fix: Changed from regionId to regionIds
    searchParams.append('includeRegionId', 'true');
  }
  
  if (params.minPopulation) {
    searchParams.append('minPopulation', params.minPopulation.toString());
  }
  
  if (params.maxPopulation) {
    searchParams.append('maxPopulation', params.maxPopulation.toString());
  }
  
  if (params.types?.length) {
    searchParams.append('types', params.types.join(','));
  }
  
  if (params.excludedTypes?.length) {
    searchParams.append('excludedTypes', params.excludedTypes.join(','));
  }
  
  if (params.nearLocation) {
    const { latitude, longitude, radius } = params.nearLocation;
    searchParams.append('location', `${latitude},${longitude}`);
    if (radius) {
      searchParams.append('radius', radius.toString());
    }
  }
  
  searchParams.append('limit', String(params.limit || DEFAULT_LIMIT));
  if (params.offset) searchParams.append('offset', params.offset.toString());
  searchParams.append('sort', params.sort || '-population');

  try {
    console.log('Fetching cities with params:', Object.fromEntries(searchParams.entries()));
    const response = await fetchWithRetry(
      `${CITIES_ENDPOINT}?${searchParams.toString()}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      return {
        data: [],
        metadata: { currentOffset: 0, totalCount: 0, limit: params.limit || DEFAULT_LIMIT }
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch cities error:', error);
    return {
      data: [],
      metadata: { currentOffset: 0, totalCount: 0, limit: params.limit || DEFAULT_LIMIT }
    };
  }
}

/**
 * Fetch countries for dropdown filters
 */
export async function fetchCountries(): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${BASE_URL}/countries?limit=100`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw {
        message: error.message,
        code: 'API_ERROR'
      } as ApiError;
    }
    throw {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR'
    } as ApiError;
  }
}

export async function fetchCityDetails(cityId: string): Promise<CityDetails> {
  try {
    const response = await fetch(
      `${CITIES_ENDPOINT}/${cityId}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw {
        message: error.message,
        code: 'API_ERROR'
      } as ApiError;
    }
    throw {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR'
    } as ApiError;
  }
}

export interface NearbyCitiesParams {
  cityId: string;
  radius?: number;
  limit?: number;
  minPopulation?: number;
  offset?: number;
}

export async function fetchNearbyCities(params: NearbyCitiesParams): Promise<ApiResponse> {
  try {
    const searchParams = new URLSearchParams({
      radius: String(params.radius || 100),
      limit: String(params.limit || 10),
      offset: String(params.offset || 0),
      minPopulation: String(params.minPopulation || 1000)
    });

    const url = `${CITIES_ENDPOINT}/${params.cityId}/nearbyCities`;
    
    console.log('Fetching nearby cities:', `${url}?${searchParams.toString()}`);
    
    const response = await fetchWithRetry(
      `${url}?${searchParams.toString()}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      console.error('Failed to fetch nearby cities:', response.status);
      return {
        data: [],
        metadata: { currentOffset: 0, totalCount: 0, limit: params.limit || 10 }
      };
    }

    const data = await response.json();
    console.log('Nearby cities response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching nearby cities:', error);
    return {
      data: [],
      metadata: { currentOffset: 0, totalCount: 0, limit: params.limit || 10 }
    };
  }
}

export interface RegionsResponse {
  data: Array<{
    id: string;
    name: string;
    countryCode: string;
    wikiDataId?: string;
  }>;
  metadata: {
    currentOffset: number;
    totalCount: number;
    limit: number;
  };
}

export async function fetchRegions(countryId: string): Promise<RegionsResponse> {
  try {
    const searchParams = new URLSearchParams({
      limit: '10',
      offset: '0',
      sort: 'name',
      languageCode: 'en'
    });

    const url = `${BASE_URL}/countries/${countryId.toUpperCase()}/regions?${searchParams}`;
    console.log('Fetching regions:', url);

    const response = await fetchWithRetry(
      url,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      console.error('Failed to fetch regions:', response.status);
      throw new Error(`Failed to fetch regions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Regions response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }
}

export interface RegionCitiesParams {
  countryId: string;
  regionCode: string;
  namePrefix?: string;
  minPopulation?: number;
  maxPopulation?: number;
  types?: string[];
  limit?: number;
  offset?: number;
  sort?: string;
}

/**
 * Fetch cities for a specific region in a country
 */
export async function fetchRegionCities(params: RegionCitiesParams): Promise<ApiResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.namePrefix) searchParams.append('namePrefix', params.namePrefix);
  if (params.minPopulation) searchParams.append('minPopulation', params.minPopulation.toString());
  if (params.maxPopulation) searchParams.append('maxPopulation', params.maxPopulation.toString());
  if (params.types?.length) searchParams.append('types', params.types.join(','));
  searchParams.append('limit', String(params.limit || DEFAULT_LIMIT));
  searchParams.append('offset', String(params.offset || 0));
  searchParams.append('sort', params.sort || '-population');

  const url = `${BASE_URL}/countries/${params.countryId}/regions/${params.regionCode}/cities`;

  try {
    console.log('Fetching region cities:', url);
    const response = await fetchWithRetry(
      `${url}?${searchParams.toString()}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      return {
        data: [],
        metadata: { currentOffset: 0, totalCount: 0, limit: params.limit || DEFAULT_LIMIT }
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching region cities:', error);
    return {
      data: [],
      metadata: { currentOffset: 0, totalCount: 0, limit: params.limit || DEFAULT_LIMIT }
    };
  }
}



