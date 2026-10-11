-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `distanceKm` DOUBLE NULL;

-- AlterTable
ALTER TABLE `rides` ADD COLUMN `pricePerKm` DOUBLE NOT NULL DEFAULT 5.00;
