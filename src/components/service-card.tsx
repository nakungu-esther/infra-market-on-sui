'use client';

import { Service } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, Tag } from 'lucide-react';
import Link from 'next/link';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const pricing = service.pricingInfo;
  const metadata = service.metadata || {};
  const contact = service.contactInfo || {};
  
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              {service.name}
              {service.tags?.some((t) => t.addedByAdmin) && (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {service.provider?.name || 'Unknown Provider'}
            </CardDescription>
          </div>
          <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
            {service.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {service.description || 'No description available'}
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{service.serviceType}</Badge>
            {service.isAcceptingUsers && (
              <Badge variant="secondary" className="text-xs">
                Accepting New Users
              </Badge>
            )}
          </div>

          {service.tags && service.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {service.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant={tag.addedByAdmin ? 'default' : 'secondary'} className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.tag}
                </Badge>
              ))}
              {service.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{service.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {pricing && (
            <div className="pt-2">
              <div className="text-sm font-medium mb-1">Pricing</div>
              <div className="flex items-baseline gap-2">
                {pricing.tiers && pricing.tiers.length > 0 ? (
                  <>
                    <span className="text-2xl font-bold">
                      {pricing.tiers[0].price === 0 ? 'Free' : `${pricing.tiers[0].price} ${pricing.tiers[0].currency || 'SUI'}`}
                    </span>
                    {pricing.tiers[0].interval && (
                      <span className="text-sm text-muted-foreground">
                        /{pricing.tiers[0].interval}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Contact for pricing</span>
                )}
              </div>
              {pricing.tiers && pricing.tiers.length > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {pricing.tiers.length} tiers available
                </p>
              )}
            </div>
          )}

          {metadata.tokens_accepted && metadata.tokens_accepted.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Accepts: {metadata.tokens_accepted.join(', ')}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button asChild className="flex-1 cursor-pointer">
          <Link href={`/services/${service.id}`}>
            View Details
          </Link>
        </Button>
        {contact.documentation_url && (
          <Button asChild variant="outline" size="icon" className="cursor-pointer">
            <a
              href={contact.documentation_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};