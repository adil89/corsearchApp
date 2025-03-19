import { useState } from 'react';
import { City } from '../../types/City';
import { CityDetails } from '../../types/ApiResponse';
import { CityCard } from '../CityCard/CityCard';
import { LoadingIndicator } from '../LoadingIndicator/LoadingIndicator';
import { CityDetailsModal } from '../Modal/CityDetailsModal';
import { fetchCityDetails } from '../../services/api';

interface CityListProps {
  cities: City[];
  loading: boolean;
  error?: string | null;
}

export function CityList({ cities, loading, error }: CityListProps) {
  const [selectedCity, setSelectedCity] = useState<CityDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCitySelect = async (city: City) => {
    try {
      const details = await fetchCityDetails(city.id);
      setSelectedCity(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch city details:', error);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        No cities found. Try adjusting your search criteria.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {cities.map((city) => (
          <CityCard 
            key={city.id} 
            city={city} 
            onSelect={handleCitySelect}
          />
        ))}
      </div>
      <CityDetailsModal
        city={selectedCity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}