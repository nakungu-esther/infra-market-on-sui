'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ServiceCard } from '@/components/service-card';
import { SearchFilter } from '@/components/search-filter';
import { LoadingSpinner, ServiceListSkeleton } from '@/components/loading-state';
import { EmptyState } from '@/components/empty-state';
import { useServices } from '@/hooks/useServices';
import { SearchFilters } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ServicesPage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 9;

  const { services, isLoading, error, pagination, refetch } = useServices(
    filters,
    currentPage,
    limit
  );

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Infrastructure Services</h1>
            <p className="text-lg text-muted-foreground">
              Discover and integrate infrastructure services for your Sui applications
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <SearchFilter
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={handleSearch}
            />
          </div>

          {/* Results */}
          {error && (
            <EmptyState
              icon="error"
              title="Error loading services"
              description={error}
              action={{
                label: 'Try Again',
                onClick: refetch,
              }}
            />
          )}

          {isLoading && <ServiceListSkeleton count={9} />}

          {!isLoading && !error && services.length === 0 && (
            <EmptyState
              icon="search"
              title="No services found"
              description="Try adjusting your filters or search query to find what you're looking for."
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setFilters({});
                  setCurrentPage(1);
                },
              }}
            />
          )}

          {!isLoading && !error && services.length > 0 && (
            <>
              {/* Results count */}
              <div className="mb-6 text-sm text-muted-foreground">
                Showing {(currentPage - 1) * limit + 1} to{' '}
                {Math.min(currentPage * limit, pagination.total)} of {pagination.total} services
              </div>

              {/* Services grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === pagination.total_pages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;

                        return (
                          <div key={page} className="flex items-center gap-2">
                            {showEllipsisBefore && (
                              <span className="text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.total_pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
