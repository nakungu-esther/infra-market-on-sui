// Custom hook for service data fetching
'use client';

import { useState, useEffect } from 'react';
import { Service, SearchFilters } from '@/types';
import { servicesApi } from '@/lib/api';

export const useServices = (filters?: SearchFilters, page: number = 1, limit: number = 20) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  });

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = { limit, offset: (page - 1) * limit };
      
      if (filters) {
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        if (filters.tags) params.tags = filters.tags;
      }

      const response = await servicesApi.getAll(params);

      if (response.success && response.data) {
        const data = response.data as any;
        const servicesData = data.services || [];
        setServices(servicesData);
        setPagination({
          total: data.total || 0,
          page: page,
          limit: data.limit || limit,
          total_pages: Math.ceil((data.total || 0) / limit),
        });
      } else {
        setError(response.error || 'Failed to fetch services');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, limit, JSON.stringify(filters)]);

  return {
    services,
    isLoading,
    error,
    pagination,
    refetch: fetchServices,
  };
};

export const useService = (id: string | number) => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await servicesApi.getById(id);

        if (response.success && response.data) {
          const data = response.data as any;
          setService(data.service || data);
        } else {
          setError(response.error || 'Failed to fetch service');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id]);

  return {
    service,
    isLoading,
    error,
  };
};

export const useMyServices = (params?: Record<string, any>) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
  });

  const fetchMyServices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await servicesApi.getMyServices(params);

      if (response.success && response.data) {
        const data = response.data as any;
        setServices(data.services || []);
        setPagination({
          total: data.total || 0,
          limit: data.limit || 20,
          offset: data.offset || 0,
        });
      } else {
        setError(response.error || 'Failed to fetch services');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyServices();
  }, [JSON.stringify(params)]);

  return {
    services,
    isLoading,
    error,
    pagination,
    refetch: fetchMyServices,
  };
};