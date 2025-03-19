import { useState, useEffect } from 'react';
import { X, Globe2, MapPin, Users, Clock, Mountain, Building, Loader2 } from 'lucide-react';
import { CityDetails } from '../../types/ApiResponse';
import { LeafletMap } from '../Map/LeafletMap';
import { fetchNearbyCities } from '../../services/api';
import { City } from '../../types/City';

const TABS = {
  DETAILS: 'Details',
  NEARBY: 'Nearby Cities'
} as const;

type TabType = typeof TABS[keyof typeof TABS];

interface CityDetailsModalProps {
  city: CityDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CityDetailsModal({ city, isOpen, onClose }: CityDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(TABS.DETAILS);
  const [nearbyCities, setNearbyCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNearbyCities = async () => {
    if (!city || activeTab !== TABS.NEARBY) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchNearbyCities({
        cityId: city.id,
        radius: 100,
        limit: 10,
        minPopulation: 1000,
        offset: 0
      });

      if (response.data) {
        const filteredCities = response.data
          .filter(c => c.id !== city.id)
          .map(c => ({
            ...c,
            population: c.population || 0
          }));
        console.log(`Found ${filteredCities.length} nearby cities`);
        setNearbyCities(filteredCities);
      }
    } catch (error) {
      console.error('Error loading nearby cities:', error);
      setError('Failed to load nearby cities. Please try again.');
      setNearbyCities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initLoad() {
      if (!mounted) return;
      await loadNearbyCities();
    }

    initLoad();
    return () => { mounted = false; };
  }, [city, activeTab]);

  if (!isOpen || !city) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-4xl h-[90vh] p-8 flex flex-col overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{city.name}</h2>
            <p className="text-gray-500">{city.type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex border-b mb-6">
          {Object.values(TABS).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 -mb-px ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === TABS.DETAILS ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p>{city.country} - {city.region || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">Population</p>
                      <p>{city.population?.toLocaleString() || 'N/A'} residents</p>
                    </div>
                  </div>

                  {city.timezone && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">Timezone</p>
                        <p>{city.timezone}</p>
                      </div>
                    </div>
                  )}

                  {typeof city.elevationMeters === 'number' && (
                    <div className="flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">Elevation</p>
                        <p>{city.elevationMeters.toLocaleString()}m above sea level</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">Coordinates</p>
                      <p>{city.latitude.toFixed(4)}°, {city.longitude.toFixed(4)}°</p>
                    </div>
                  </div>

                  {city.wikiDataId && (
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">Additional Information</p>
                        <a 
                          href={`https://www.wikidata.org/wiki/${city.wikiDataId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View on Wikidata
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-full min-h-[400px]">
                <LeafletMap 
                  lat={city.latitude} 
                  lng={city.longitude}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Cities within 100km</h3>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={() => loadNearbyCities()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : nearbyCities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No nearby cities found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nearbyCities.map(nearbyCity => (
                    <div 
                      key={nearbyCity.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <h4 className="font-semibold">{nearbyCity.name}</h4>
                      <p className="text-sm text-gray-600">
                        {nearbyCity.population?.toLocaleString() || 'N/A'} residents
                      </p>
                      <p className="text-sm text-gray-600">
                        {nearbyCity.region || ''}, {nearbyCity.country}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}