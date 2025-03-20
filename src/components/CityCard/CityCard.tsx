import { MapPin, Users, Globe2 } from 'lucide-react';
import { City } from '../../types/City';

interface CityCardProps {
  city: City;
  onSelect: (city: City) => void;
}
 //test pipeline
 // second test 
export function CityCard({ city, onSelect }: CityCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => onSelect(city)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{city.name}</h3>
          <p className="text-gray-600 flex items-center mt-2">
            <Globe2 className="w-4 h-4 mr-2" />
            {city.country}
          </p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-gray-600 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          {city.region}
        </p>
        <p className="text-gray-600 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          {city.population?.toLocaleString()} residents
        </p>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Coordinates: {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
      </div>
    </div>
  );
}