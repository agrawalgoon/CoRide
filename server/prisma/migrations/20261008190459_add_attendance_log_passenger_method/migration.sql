/*
  Warnings:

  - You are about to drop the column `qrTokenHash` on the `attendance_logs` table. All the data in the column will be lost.
  - Added the required column `method` to the `attendance_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passengerId` to the `attendance_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `attendance_logs` DROP COLUMN `qrTokenHash`,
    ADD COLUMN `method` ENUM('DYNAMIC_QR', 'MANUAL_OTP', 'DRIVER_OVERRIDE') NOT NULL,
    ADD COLUMN `passengerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `passengerLatitude` DOUBLE NULL,
    ADD COLUMN `passengerLongitude` DOUBLE NULL,
    ADD COLUMN `tokenHash` VARCHAR(128) NULL,
    MODIFY `driverLatitude` DOUBLE NULL,
    MODIFY `driverLongitude` DOUBLE NULL,
    MODIFY `distanceToPickupMeters` DOUBLE NULL,
    MODIFY `isGeofenceValid` BOOLEAN NULL;

-- CreateIndex
CREATE INDEX `attendance_logs_passengerId_idx` ON `attendance_logs`(`passengerId`);

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_passengerId_fkey` FOREIGN KEY (`passengerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
