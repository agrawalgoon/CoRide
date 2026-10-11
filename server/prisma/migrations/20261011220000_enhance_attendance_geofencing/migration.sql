-- Safe additive migration for Enhanced Attendance & Geofencing

-- 1. Alter Enum on bookings table
ALTER TABLE `bookings` 
  MODIFY COLUMN `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED_PASSENGER', 'CANCELLED_DRIVER', 'BOARDED', 'ARRIVED', 'NO_SHOW', 'COMPLETED') NOT NULL DEFAULT 'PENDING';

-- 2. Add boardingAt, arrivedAt, noShowAt columns to bookings table
ALTER TABLE `bookings`
  ADD COLUMN `boardingAt` DATETIME(3) NULL,
  ADD COLUMN `arrivedAt` DATETIME(3) NULL,
  ADD COLUMN `noShowAt` DATETIME(3) NULL;

-- 3. Alter Enum on attendance_logs table
ALTER TABLE `attendance_logs`
  MODIFY COLUMN `method` ENUM('DYNAMIC_QR', 'MANUAL_OTP', 'DRIVER_OVERRIDE', 'CAMPUS_GEOFENCE') NOT NULL;

-- 4. Add status, accuracyMeters, locationDenied, notes columns to attendance_logs table
ALTER TABLE `attendance_logs`
  ADD COLUMN `status` VARCHAR(50) NULL,
  ADD COLUMN `accuracyMeters` DOUBLE NULL,
  ADD COLUMN `locationDenied` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `notes` VARCHAR(255) NULL;

-- 5. Add unique index on tokenHash to prevent replay attacks
CREATE UNIQUE INDEX `attendance_logs_tokenHash_key` ON `attendance_logs`(`tokenHash`);

-- 6. Add composite index on bookingId and status
CREATE INDEX `attendance_logs_bookingId_status_idx` ON `attendance_logs`(`bookingId`, `status`);

-- 7. Alter Enum on notifications table
ALTER TABLE `notifications`
  MODIFY COLUMN `type` ENUM('RIDE_REQUEST_RECEIVED', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'RIDE_DEPARTURE_REMINDER', 'AI_MATCH_FOUND', 'ATTENDANCE_SUCCESS', 'ATTENDANCE_NO_SHOW', 'RIDE_CANCELLED') NOT NULL;
