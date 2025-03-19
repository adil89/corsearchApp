import { useState, useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import { Filters } from './components/Filters/Filters';
import { CityList } from './components/CityList/CityList';
import { Pagination } from './components/Pagination/Pagination';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCityStore } from './store/useCityStore';
import { fetchCities } from './services/api';

const ITEMS_PER_PAGE = 10;

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [minPopulation, setMinPopulation] = useLocalStorage('minPopulation', 0);
  const [selectedCountry, setSelectedCountry] = useLocalStorage('selectedCountry', '');

  const { 
    cities, 
    loading, 
    error, 
    totalCount,
    filteredCities,  // Add filteredCities from store
    setCities,
    setLoading,
    setError,
    setTotalCount 
  } = useCityStore();

  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        const response = await fetchCities({
          namePrefix: searchTerm,
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE,
          minPopulation,
          countryIds: selectedCountry,
        });
        setCities(response.data);
        setTotalCount(response.metadata.totalCount);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load cities';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, [searchTerm, currentPage, minPopulation, selectedCountry, fetchTrigger]);

  // Updated totalPages calculation to use pagination metadata
  const totalPages = Math.ceil(
    filteredCities.length > 0 
      ? filteredCities.length / ITEMS_PER_PAGE
      : (totalCount || 0) / ITEMS_PER_PAGE
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setFetchTrigger(prev => prev + 1); // Trigger fetch on search
  };

  const handlePopulationChange = (value: number) => {
    setMinPopulation(value);
    setCurrentPage(1);
    setFetchTrigger(prev => prev + 1); // Trigger fetch on filter change
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setCurrentPage(1);
    setFetchTrigger(prev => prev + 1); // Trigger fetch on filter change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (page > currentPage) { // Only trigger fetch when moving forward
      setFetchTrigger(prev => prev + 1);
    }
  };

  return (
    <Layout>
      <Filters
        onSearch={handleSearch}
        onPopulationChange={handlePopulationChange}
        onCountryChange={handleCountryChange}
      />
      <CityList
        cities={filteredCities.length > 0 ? filteredCities : cities}  // Use filteredCities if available
        loading={loading}
        error={error}
      />
      {!loading && !error && (totalPages > 0) && (
        <Pagination
          currentPage={filteredCities.length > 0 ? 1 : currentPage}
          totalPages={Math.max(1, totalPages)}  // Ensure at least 1 page
          onPageChange={handlePageChange}
        />
      )}
    </Layout>
  );
}

export default App;