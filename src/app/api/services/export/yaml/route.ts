import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, serviceTags } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active services ordered by name
    const activeServices = await db.select()
      .from(services)
      .where(eq(services.status, 'active'))
      .orderBy(asc(services.name));

    // Fetch all tags for these services
    const serviceIds = activeServices.map(s => s.id);
    let allTags: Array<{ serviceId: number; tag: string }> = [];
    
    if (serviceIds.length > 0) {
      allTags = await db.select({
        serviceId: serviceTags.serviceId,
        tag: serviceTags.tag
      })
        .from(serviceTags)
        .where(eq(serviceTags.serviceId, serviceIds[0]));
      
      // Fetch tags for remaining services if more than one
      for (let i = 1; i < serviceIds.length; i++) {
        const moreTags = await db.select({
          serviceId: serviceTags.serviceId,
          tag: serviceTags.tag
        })
          .from(serviceTags)
          .where(eq(serviceTags.serviceId, serviceIds[i]));
        allTags = allTags.concat(moreTags);
      }
    }

    // Group tags by serviceId
    const tagsByService = allTags.reduce((acc, { serviceId, tag }) => {
      if (!acc[serviceId]) {
        acc[serviceId] = [];
      }
      acc[serviceId].push(tag);
      return acc;
    }, {} as Record<number, string[]>);

    // Generate YAML manually
    const exportedAt = new Date().toISOString();
    const count = activeServices.length;

    let yaml = `exportedAt: "${exportedAt}"\n`;
    yaml += `count: ${count}\n`;
    yaml += `services:\n`;

    for (const service of activeServices) {
      yaml += `  - id: ${service.id}\n`;
      yaml += `    name: "${escapeYamlString(service.name)}"\n`;
      
      if (service.description) {
        yaml += `    description: "${escapeYamlString(service.description)}"\n`;
      }
      
      yaml += `    serviceType: "${escapeYamlString(service.serviceType)}"\n`;
      yaml += `    status: "${escapeYamlString(service.status)}"\n`;
      yaml += `    providerId: "${escapeYamlString(service.providerId)}"\n`;
      yaml += `    isAcceptingUsers: ${service.isAcceptingUsers}\n`;
      
      if (service.metadata) {
        const metadataJson = JSON.stringify(service.metadata);
        yaml += `    metadata: '${escapeYamlString(metadataJson)}'\n`;
      }
      
      if (service.pricingInfo) {
        const pricingJson = JSON.stringify(service.pricingInfo);
        yaml += `    pricingInfo: '${escapeYamlString(pricingJson)}'\n`;
      }
      
      if (service.contactInfo) {
        const contactJson = JSON.stringify(service.contactInfo);
        yaml += `    contactInfo: '${escapeYamlString(contactJson)}'\n`;
      }
      
      yaml += `    createdAt: "${service.createdAt}"\n`;
      yaml += `    updatedAt: "${service.updatedAt}"\n`;
      
      // Add tags
      const serviceTags = tagsByService[service.id] || [];
      if (serviceTags.length > 0) {
        yaml += `    tags:\n`;
        for (const tag of serviceTags) {
          yaml += `      - "${escapeYamlString(tag)}"\n`;
        }
      } else {
        yaml += `    tags: []\n`;
      }
    }

    // Return as YAML with proper headers
    return new Response(yaml, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml',
        'Content-Disposition': 'attachment; filename="services.yaml"',
      },
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

function escapeYamlString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}