-- AlterTable
ALTER TABLE `rides` ADD COLUMN `recurringParentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `rides_recurringParentId_idx` ON `rides`(`recurringParentId`);
