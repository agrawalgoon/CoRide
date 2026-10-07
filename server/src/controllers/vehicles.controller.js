import { prisma } from '../config/db.js';

/**
 * Register a new vehicle for the authenticated user.
 */
export const createVehicle = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      make,
      model,
      year,
      color,
      plateNumber,
      seatCapacity,
      vehicleType,
      rcPhotoUrl,
      insuranceValidUntil
    } = req.body;

    // Check if plateNumber is already registered
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber }
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this license plate is already registered',
        error: {
          message: 'A vehicle with this license plate is already registered',
          code: 'DUPLICATE_PLATE_NUMBER'
        }
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId,
        make,
        model,
        year,
        color,
        plateNumber,
        seatCapacity,
        vehicleType: vehicleType || 'SEDAN',
        rcPhotoUrl: rcPhotoUrl || null,
        insuranceValidUntil: insuranceValidUntil || null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all vehicles owned by the authenticated user.
 */
export const getVehicles = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a specific vehicle by ID, strictly enforcing ownership.
 */
export const getVehicleById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: {
          message: 'Vehicle not found',
          code: 'VEHICLE_NOT_FOUND'
        }
      });
    }

    // Ownership check
    if (vehicle.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this vehicle',
        error: {
          message: 'You do not have permission to access this vehicle',
          code: 'FORBIDDEN'
        }
      });
    }

    return res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing vehicle, strictly enforcing ownership.
 */
export const updateVehicle = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const {
      make,
      model,
      year,
      color,
      plateNumber,
      seatCapacity,
      vehicleType,
      rcPhotoUrl,
      insuranceValidUntil,
      isActive
    } = req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: {
          message: 'Vehicle not found',
          code: 'VEHICLE_NOT_FOUND'
        }
      });
    }

    // Ownership check
    if (vehicle.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this vehicle',
        error: {
          message: 'You do not have permission to update this vehicle',
          code: 'FORBIDDEN'
        }
      });
    }

    // If updating plateNumber, ensure it is not taken by another vehicle
    if (plateNumber && plateNumber !== vehicle.plateNumber) {
      const duplicatePlate = await prisma.vehicle.findFirst({
        where: {
          plateNumber,
          id: { not: id }
        }
      });

      if (duplicatePlate) {
        return res.status(409).json({
          success: false,
          message: 'A vehicle with this license plate is already registered',
          error: {
            message: 'A vehicle with this license plate is already registered',
            code: 'DUPLICATE_PLATE_NUMBER'
          }
        });
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(make !== undefined && { make }),
        ...(model !== undefined && { model }),
        ...(year !== undefined && { year }),
        ...(color !== undefined && { color }),
        ...(plateNumber !== undefined && { plateNumber }),
        ...(seatCapacity !== undefined && { seatCapacity }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(rcPhotoUrl !== undefined && { rcPhotoUrl }),
        ...(insuranceValidUntil !== undefined && { insuranceValidUntil }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a vehicle, strictly enforcing ownership.
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: {
          message: 'Vehicle not found',
          code: 'VEHICLE_NOT_FOUND'
        }
      });
    }

    // Ownership check
    if (vehicle.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this vehicle',
        error: {
          message: 'You do not have permission to delete this vehicle',
          code: 'FORBIDDEN'
        }
      });
    }

    // Guard against deleting a vehicle currently tied to scheduled or active rides
    const activeRide = await prisma.ride.findFirst({
      where: {
        vehicleId: id,
        status: { in: ['SCHEDULED', 'ACTIVE'] }
      }
    });

    if (activeRide) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle associated with active or scheduled rides',
        error: {
          message: 'Cannot delete vehicle associated with active or scheduled rides',
          code: 'VEHICLE_HAS_ACTIVE_RIDES'
        }
      });
    }

    await prisma.vehicle.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
