-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_organizationId_fkey`;

-- AlterTable
ALTER TABLE `users` CHANGE COLUMN `fullName` `name` VARCHAR(150) NOT NULL,
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    MODIFY `organizationId` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(20) NULL,
    MODIFY `orgEmail` VARCHAR(255) NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
