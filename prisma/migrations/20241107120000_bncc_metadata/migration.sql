-- AlterTable
ALTER TABLE "CurriculumStandard" ADD COLUMN "componenteCurricular" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CurriculumStandard" ADD COLUMN "unidadeTematica" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CurriculumStandard" ADD COLUMN "objetoConhecimento" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "CurriculumStandard" ADD COLUMN "referencias" TEXT;

-- AlterTable
ALTER TABLE "ContentModule" ADD COLUMN "learningOutcomes" TEXT;
