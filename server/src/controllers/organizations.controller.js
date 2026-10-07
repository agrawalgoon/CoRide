import { prisma } from '../config/db.js';

export const createOrganization = async (req, res, next) => {
  try {
    const {
      name,
      orgType,
      domainList,
      campusHubName,
      campusAddress,
      campusLatitude,
      campusLongitude,
      geofenceRadiusMeters
    } = req.body;

    if (
      !name ||
      !orgType ||
      !domainList ||
      !campusHubName ||
      !campusAddress ||
      campusLatitude === undefined ||
      campusLongitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required organization fields must be provided'
      });
    }

    if (!Array.isArray(domainList) || domainList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'domainList must contain at least one domain'
      });
    }

    const existingOrganization = await prisma.organization.findUnique({
      where: {
        name: name.trim()
      }
    });

    if (existingOrganization) {
      return res.status(409).json({
        success: false,
        message: 'An organization with this name already exists'
      });
    }

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        orgType,
        domainList,
        campusHubName: campusHubName.trim(),
        campusAddress: campusAddress.trim(),
        campusLatitude: Number(campusLatitude),
        campusLongitude: Number(campusLongitude),
        geofenceRadiusMeters:
          geofenceRadiusMeters !== undefined
            ? Number(geofenceRadiusMeters)
            : 200
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizations = async (req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        orgType: true,
        domainList: true,
        campusHubName: true,
        campusAddress: true,
        campusLatitude: true,
        campusLongitude: true,
        geofenceRadiusMeters: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      success: true,
      organizations
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        name: true,
        orgType: true,
        domainList: true,
        campusHubName: true,
        campusAddress: true,
        campusLatitude: true,
        campusLongitude: true,
        geofenceRadiusMeters: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!organization || !organization.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    return res.status(200).json({
      success: true,
      organization
    });
  } catch (error) {
    next(error);
  }
};