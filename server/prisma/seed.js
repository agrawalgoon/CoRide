import { prisma } from '../src/config/db.js';

const targetOrganizations = [
  {
    name: 'MGM University',
    orgType: 'COLLEGE',
    domainList: ['mgmu.ac.in', 'mgmcen.ac.in', 'gmail.com', 'outlook.com', 'yahoo.com'],
    campusHubName: 'MGM University Main Gate & Campus Transit Center',
    campusAddress: 'N-6, CIDCO, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra 431003',
    campusLatitude: 19.8735,
    campusLongitude: 75.3621,
    geofenceRadiusMeters: 400,
    isActive: true,
  },
  {
    name: 'Deogiri College',
    orgType: 'COLLEGE',
    domainList: ['deogiricollege.org', 'dietms.org', 'gmail.com', 'outlook.com', 'yahoo.com'],
    campusHubName: 'Deogiri Main Gate & Student Transit Point',
    campusAddress: 'Railway Station Road, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra 431005',
    campusLatitude: 19.8710,
    campusLongitude: 75.3195,
    geofenceRadiusMeters: 350,
    isActive: true,
  },
  {
    name: 'Government College of Engineering, Aurangabad (GECA)',
    orgType: 'COLLEGE',
    domainList: ['geca.ac.in', 'gmail.com', 'outlook.com', 'yahoo.com'],
    campusHubName: 'GECA Main Entrance & Administrative Block',
    campusAddress: 'Station Road, Osmanpura, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra 431005',
    campusLatitude: 19.8659,
    campusLongitude: 75.3238,
    geofenceRadiusMeters: 350,
    isActive: true,
  },
];

async function main() {
  console.log('Updating organizations in database...');

  // First delete any previous placeholder organizations
  await prisma.organization.deleteMany({
    where: {
      name: {
        notIn: targetOrganizations.map((o) => o.name),
      },
    },
  });

  for (const org of targetOrganizations) {
    const existing = await prisma.organization.findUnique({
      where: { name: org.name },
    });

    if (!existing) {
      const created = await prisma.organization.create({ data: org });
      console.log(`Created: ${created.name}`);
    } else {
      await prisma.organization.update({
        where: { id: existing.id },
        data: org,
      });
      console.log(`Updated: ${existing.name}`);
    }
  }

  const all = await prisma.organization.findMany({ select: { id: true, name: true } });
  console.log('Current organizations in database:');
  console.table(all);
}

main()
  .catch((e) => {
    console.error('Error seeding organizations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
