-- CreateEnum
CREATE TYPE "Region" AS ENUM ('UAE', 'INDIA', 'BOTH');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "currentRole" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "yearsExperience" TEXT;

-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "region" "Region" NOT NULL DEFAULT 'BOTH';

-- CreateIndex
CREATE INDEX "JobPosting_region_idx" ON "JobPosting"("region");
