// frontend/src/hooks/useVenues.js
import { useState, useEffect, useCallback } from 'react';
import { venueService } from '../services/venueService';

export const useVenues = (initialFilters = {}) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const fetchVenues = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const queryParams = { ...filters, ...params };
      
      // Convert frontend params to backend expected params
      const backendParams = {
        city: queryParams.city || undefined,
        sport: queryParams.sport || undefined,
        minPrice: queryParams.minPrice || undefined,
        maxPrice: queryParams.maxPrice || undefined,
        rating: queryParams.rating || undefined,
        page: queryParams.page || 1,
        limit: queryParams.limit || 12,
        sortBy: queryParams.sortBy || 'createdAt',
        sortOrder: queryParams.sortOrder || 'desc'
      };
      
      // Remove undefined and empty values
      Object.keys(backendParams).forEach(key => {
        if (backendParams[key] === undefined || backendParams[key] === '' || backendParams[key] === 0) {
          delete backendParams[key];
        }
      });

      const response = await venueService.getAllVenues(backendParams);

      if (response.data?.status === 'success') {
        setVenues(response.data.data.venues);
        setPagination({
          currentPage: response.data.data.currentPage || 1,
          totalPages: response.data.data.totalPages || 1,
          total: response.data.data.total || 0
        });
      } else {
        throw new Error('Failed to fetch venues');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const searchVenues = useCallback(async (searchParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use enhanced search that supports both text search and filters
      const backendParams = {
        search: searchParams.search?.trim() || undefined,
        city: searchParams.city || undefined,
        sport: searchParams.sport || undefined,
        minPrice: searchParams.minPrice || undefined,
        maxPrice: searchParams.maxPrice || undefined,
        rating: searchParams.rating || undefined,
        page: searchParams.page || 1,
        limit: searchParams.limit || 12,
        sortBy: searchParams.sortBy || 'rating.average',
        sortOrder: searchParams.sortOrder || 'desc'
      };
      
      // Remove undefined values
      Object.keys(backendParams).forEach(key => {
        if (backendParams[key] === undefined || backendParams[key] === '' || backendParams[key] === 0) {
          delete backendParams[key];
        }
      });

      let response;
      
      // If there's a search query, use the enhanced search
      if (backendParams.search) {
        response = await venueService.enhancedSearch(backendParams);
      } else {
        // Otherwise use regular filtering
        response = await venueService.getAllVenues(backendParams);
      }

      if (response.data?.status === 'success') {
        setVenues(response.data.data.venues);
        setPagination({
          currentPage: response.data.data.currentPage || 1,
          totalPages: response.data.data.totalPages || 1,
          total: response.data.data.total || 0
        });
      } else {
        throw new Error('Failed to search venues');
      }
    } catch (err) {
      setError(err.message || 'Failed to search venues');
    } finally {
      setLoading(false);
    }
  }, []);

  const getSearchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    try {
      const response = await venueService.getSearchSuggestions(query.trim());
      return response.data?.data?.suggestions || [];
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      return [];
    }
  }, []);

  const getTopVenues = useCallback(async (limit = 6) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await venueService.getTopVenues(limit);

      if (response.data?.status === 'success') {
        setVenues(response.data.data.venues);
      } else {
        throw new Error('Failed to fetch top venues');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch top venues');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    const defaultFilters = {
      search: '',
      sport: '',
      minPrice: 0,
      maxPrice: 5000,
      rating: 0
    };
    setFilters(defaultFilters);
    fetchVenues(defaultFilters);
  }, [fetchVenues]);

  // Fetch venues on initial load
  useEffect(() => {
    fetchVenues();
  }, []); // Only run on mount

  // Fetch venues when filters change
  useEffect(() => {
    if (filters !== initialFilters) {
      fetchVenues();
    }
  }, [filters, fetchVenues, initialFilters]);

  return {
    venues,
    loading,
    error,
    filters,
    pagination,
    fetchVenues,
    searchVenues,
    getTopVenues,
    getSearchSuggestions,
    updateFilters,
    clearFilters
  };
};
