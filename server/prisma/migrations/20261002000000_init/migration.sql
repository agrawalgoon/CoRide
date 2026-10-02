-- ========================================================
-- CoRide: Initial Database Schema Migration for MySQL 8.0+
-- Migration: 20261002000000_init
-- ========================================================

-- CreateTable: organizations
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `orgType` ENUM('COLLEGE', 'CORPORATE', 'TECH_PARK') NOT NULL DEFAULT 'COLLEGE',
    `domainList` JSON NOT NULL,
    `campusHubName` VARCHAR(255) NOT NULL,
    `campusAddress` VARCHAR(500) NOT NULL,
    `campusLatitude` DOUBLE NOT NULL,
    `campusLongitude` DOUBLE NOT NULL,
    `geofenceRadiusMeters` INTEGER NOT NULL DEFAULT 200,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: users
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `orgEmail` VARCHAR(255) NOT NULL,
    `orgRole` ENUM('STUDENT', 'FACULTY', 'STAFF', 'EMPLOYEE') NOT NULL DEFAULT 'STUDENT',
    `orgIdBadgeUrl` VARCHAR(500) NULL,
    `isOrgVerified` BOOLEAN NOT NULL DEFAULT false,
    `dlNumber` VARCHAR(50) NULL,
    `dlPhotoUrl` VARCHAR(500) NULL,
    `isDlVerified` BOOLEAN NOT NULL DEFAULT false,
    `verificationStatus` ENUM('PENDING_EMAIL', 'EMAIL_VERIFIED', 'DOCS_SUBMITTED', 'FULLY_VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING_EMAIL',
    `driverRatingAvg` DOUBLE NOT NULL DEFAULT 5.00,
    `driverRatingCount` INTEGER NOT NULL DEFAULT 0,
    `passengerRatingAvg` DOUBLE NOT NULL DEFAULT 5.00,
    `passengerRatingCount` INTEGER NOT NULL DEFAULT 0,
    `co2SavedKgTotal` DOUBLE NOT NULL DEFAULT 0.00,
    `preferences` JSON NULL,
    `emergencyContact` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_organizationId_idx`(`organizationId`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: vehicles
CREATE TABLE `vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `make` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INTEGER NOT NULL,
    `color` VARCHAR(50) NOT NULL,
    `plateNumber` VARCHAR(30) NOT NULL,
    `seatCapacity` INTEGER NOT NULL,
    `vehicleType` ENUM('SEDAN', 'HATCHBACK', 'SUV', 'EV', 'MOTORBIKE') NOT NULL DEFAULT 'SEDAN',
    `rcPhotoUrl` VARCHAR(500) NULL,
    `insuranceValidUntil` DATE NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicles_plateNumber_key`(`plateNumber`),
    INDEX `vehicles_userId_idx`(`userId`),
    INDEX `vehicles_plateNumber_idx`(`plateNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: rides
CREATE TABLE `rides` (
    `id` VARCHAR(191) NOT NULL,
    `driverId` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `originAddress` VARCHAR(500) NOT NULL,
    `originLandmark` VARCHAR(255) NULL,
    `originLatitude` DOUBLE NOT NULL,
    `originLongitude` DOUBLE NOT NULL,
    `destinationAddress` VARCHAR(500) NOT NULL,
    `destinationLandmark` VARCHAR(255) NULL,
    `destinationLatitude` DOUBLE NOT NULL,
    `destinationLongitude` DOUBLE NOT NULL,
    `departureTime` DATETIME(3) NOT NULL,
    `totalSeats` INTEGER NOT NULL,
    `availableSeats` INTEGER NOT NULL,
    `pricePerSeat` DOUBLE NOT NULL DEFAULT 0.00,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurringDays` JSON NULL,
    `ladiesOnly` BOOLEAN NOT NULL DEFAULT false,
    `luggageAllowed` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `geofenceRadiusMeters` INTEGER NOT NULL DEFAULT 150,
    `activeTotpSecret` VARCHAR(64) NULL,
    `co2SavedEstimateKg` DOUBLE NOT NULL DEFAULT 3.20,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rides_driverId_idx`(`driverId`),
    INDEX `rides_vehicleId_idx`(`vehicleId`),
    INDEX `rides_departureTime_status_availableSeats_idx`(`departureTime`, `status`, `availableSeats`),
    INDEX `rides_originLatitude_originLongitude_idx`(`originLatitude`, `originLongitude`),
    INDEX `rides_destinationLatitude_destinationLongitude_idx`(`destinationLatitude`, `destinationLongitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: bookings
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `rideId` VARCHAR(191) NOT NULL,
    `passengerId` VARCHAR(191) NOT NULL,
    `seatsBooked` INTEGER NOT NULL DEFAULT 1,
    `fareContributionTotal` DOUBLE NOT NULL,
    `pickupAddress` VARCHAR(500) NOT NULL,
    `pickupLatitude` DOUBLE NOT NULL,
    `pickupLongitude` DOUBLE NOT NULL,
    `dropAddress` VARCHAR(500) NOT NULL,
    `dropLatitude` DOUBLE NOT NULL,
    `dropLongitude` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED_PASSENGER', 'CANCELLED_DRIVER', 'BOARDED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `isAttended` BOOLEAN NOT NULL DEFAULT false,
    `attendedAt` DATETIME(3) NULL,
    `attendanceMethod` ENUM('DYNAMIC_QR', 'MANUAL_OTP', 'DRIVER_OVERRIDE') NULL,
    `attendanceDistanceMeters` DOUBLE NULL,
    `cancellationReason` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookings_rideId_idx`(`rideId`),
    INDEX `bookings_passengerId_idx`(`passengerId`),
    INDEX `bookings_status_idx`(`status`),
    UNIQUE INDEX `bookings_rideId_passengerId_key`(`rideId`, `passengerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: attendance_logs
CREATE TABLE `attendance_logs` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `rideId` VARCHAR(191) NOT NULL,
    `driverLatitude` DOUBLE NOT NULL,
    `driverLongitude` DOUBLE NOT NULL,
    `distanceToPickupMeters` DOUBLE NOT NULL,
    `isGeofenceValid` BOOLEAN NOT NULL,
    `qrTokenHash` VARCHAR(128) NOT NULL,
    `verifiedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendance_logs_bookingId_idx`(`bookingId`),
    INDEX `attendance_logs_rideId_idx`(`rideId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: notifications
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `type` ENUM('RIDE_REQUEST_RECEIVED', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'RIDE_DEPARTURE_REMINDER', 'AI_MATCH_FOUND', 'ATTENDANCE_SUCCESS', 'RIDE_CANCELLED') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_recipientId_isRead_createdAt_idx`(`recipientId`, `isRead`, `createdAt`),
    INDEX `notifications_recipientId_idx`(`recipientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rides` ADD CONSTRAINT `rides_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rides` ADD CONSTRAINT `rides_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_rideId_fkey` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_passengerId_fkey` FOREIGN KEY (`passengerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_rideId_fkey` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
