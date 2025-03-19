import { City } from './City';

export interface ApiResponse {
  data: City[];
  metadata: {
    currentOffset: number;
    totalCount: number;
    limit: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
}

// Extended City Details type from the /cities/{id} endpoint
export interface CityDetails extends City {
  elevationMeters: number;
  timezone: string;
  wikiDataId: string;
  type: string;
  distance?: number;
}