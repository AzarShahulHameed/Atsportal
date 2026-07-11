-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "niceToHave" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "salaryRange" TEXT;
