import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { COUNTRIES } from '../../data/countries';
import { COUNTRY_TO_CODE } from '../../data/countryCodes';
import { fetchRegions } from '../../services/api';
import { useCityStore } from '../../store/useCityStore';
// Remove CityState import since it's not being used

interface CityParams {
  countryIds: string;
  regionIds?: string; // Changed from regionId to regionIds to match API
  limit: number;
  offset: number;
  minPopulation?: number;
  maxPopulation?: number;
}

interface Region {
  id: string;
  name: string;
}

interface FiltersProps {
  onSearch: (value: string) => void;
  onPopulationChange: (min: number, max: number) => void;
  onCountryChange: (value: string) => void;
  onLocationChange?: (lat: number, lng: number, radius: number) => void;
  onCityParamsChange?: (params: CityParams) => void;
  onRegionChange?: (value: string) => void; // Make region change optional
}

export function Filters({ 
  onSearch, 
  onPopulationChange, 
  onCountryChange,
  onRegionChange,
  onLocationChange,
  onCityParamsChange
}: FiltersProps) {
  const store = useCityStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [minPopulation, setMinPopulation] = useState<number>(0);
  const [maxPopulation, setMaxPopulation] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [radius, setRadius] = useState<number>(100);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [sortedCountries, setSortedCountries] = useState(COUNTRIES);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Reset to All Countries on mount
    handleAllCountries();
  }, []); // Empty dependency array means this runs once on mount

  const handleCountrySelect = async (country: string) => {
    const countryCode = COUNTRY_TO_CODE[country];
    if (countryCode) {
      setSelectedCountry(country);
      // Reorder countries to put selected country first
      setSortedCountries([
        country,
        ...COUNTRIES.filter(c => c !== country)
      ]);
      onCountryChange(countryCode);
      
      // Load regions for selected country
      try {
        const response = await fetchRegions(countryCode);
        setRegions(response.data || []);
      } catch (error) {
        console.error('Error loading regions:', error);
        setRegions([]);
      }
      
      // Reset region selection
      setSelectedRegion('');
      onRegionChange?.('');
      
      onCityParamsChange?.({
        countryIds: countryCode,
        limit: 20,
        offset: 0
      });
    } else {
      console.warn(`No country code found for: ${country}`);
    }
    setIsCountryDropdownOpen(false);
  };

  const handleAllCountries = () => {
    onCountryChange('');
    setSelectedCountry('');
    setIsCountryDropdownOpen(false);
    // Reset city params when all countries is selected
    onCityParamsChange?.({
      countryIds: '',
      limit: 20,
      offset: 0
    });
    setSortedCountries(COUNTRIES); // Reset to original order
  };

  const handlePopulationChange = (min: number | null, max: number | null) => {
    const validMin = min && min > 0 ? min : 0;
    const validMax = max && max > 0 ? max : 0;
    
    setMinPopulation(validMin);
    setMaxPopulation(validMax);
    onPopulationChange(validMin, validMax);
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region.name);
    setIsRegionDropdownOpen(false);
    onRegionChange?.(region.id);

    // Use region.id (ISO code) instead of region.name
    store.filterByRegion(region.id);
    
    onCityParamsChange?.({
      countryIds: COUNTRY_TO_CODE[selectedCountry],
      regionIds: region.id,
      limit: 20,
      offset: 0,
      minPopulation: minPopulation || undefined,
      maxPopulation: maxPopulation || undefined
    });
  };

  const handleAllRegions = () => {
    setSelectedRegion('');
    setIsRegionDropdownOpen(false);
    onRegionChange?.('');

    // Reset filters in the store
    store.resetFilters();

    onCityParamsChange?.({
      countryIds: COUNTRY_TO_CODE[selectedCountry],
      limit: 20,
      offset: 0,
      minPopulation: minPopulation || undefined,
      maxPopulation: maxPopulation || undefined
    });
  };

  const regionDropdown = (
    <div ref={regionDropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Region
      </label>
      <div className="relative">
        <button
          onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
          disabled={!selectedCountry}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            !selectedCountry ? 'bg-gray-50 text-gray-400' : 
            selectedRegion ? 'text-gray-900 font-medium' : 'text-gray-500'
          }`}
        >
          {selectedRegion || (selectedCountry ? 'All Regions' : 'Select a country first')}
        </button>
        {isRegionDropdownOpen && selectedCountry && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            <div 
              className={`p-2 cursor-pointer ${!selectedRegion ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
              onClick={handleAllRegions}
            >
              All Regions
            </div>
            {regions.map(region => (
              <div
                key={region.id}
                className={`p-2 cursor-pointer ${
                  selectedRegion === region.name ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleRegionSelect(region)}
              >
                {region.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-sm p-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search cities..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Population Rangeeee
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={minPopulation || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  handlePopulationChange(value, maxPopulation);
                }}
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={maxPopulation || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  handlePopulationChange(minPopulation, value);
                }}
              />
            </div>
          </div>
          <div ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <div className="relative">
              <button
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedCountry ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}
              >
                {selectedCountry || 'All Countries'}
              </button>
              {isCountryDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  <div 
                    className={`p-2 cursor-pointer ${!selectedCountry ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                    onClick={handleAllCountries}
                  >
                    All Countries
                  </div>
                  {sortedCountries.map(country => (
                    <div
                      key={country}
                      className={`p-2 cursor-pointer ${
                        selectedCountry === country ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleCountrySelect(country)}
                    >
                      {country}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {regionDropdown}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Search
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Latitude"
                className="px-3 py-2 border border-gray-300 rounded-lg"
                onChange={(e) => setLatitude(Number(e.target.value))}
              />
              <input
                type="number"
                placeholder="Longitude"
                className="px-3 py-2 border border-gray-300 rounded-lg"
                onChange={(e) => setLongitude(Number(e.target.value))}
              />
              <input
                type="number"
                placeholder="Radius (km)"
                className="px-3 py-2 border border-gray-300 rounded-lg"
                value={radius}
                onChange={(e) => {
                  const newRadius = Number(e.target.value);
                  setRadius(newRadius);
                  onLocationChange?.(latitude, longitude, newRadius); // Added optional chaining operator
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}