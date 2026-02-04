'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { SearchFilters } from '@/types';

interface SearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

export const SearchFilter = ({ filters, onFiltersChange, onSearch }: SearchFilterProps) => {
  const handleQueryChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const clearFilters = () => {
    onFiltersChange({ search: filters.search });
  };

  const activeFilterCount = [
    filters.category ? 1 : 0,
    filters.type ? 1 : 0,
    filters.tags ? 1 : 0,
    filters.status ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services, providers..."
            value={filters.search || ''}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={onSearch} className="cursor-pointer">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="outline" onClick={clearFilters} className="cursor-pointer">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};