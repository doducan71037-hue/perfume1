-- CreateTable
CREATE TABLE "perfumes" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "concentration" TEXT,
    "gender" TEXT,
    "priceRange" TEXT NOT NULL DEFAULT 'mid',
    "description" TEXT,
    "profileText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameCn" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "synonyms" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accords" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameCn" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameCn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfume_notes" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfume_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfume_accords" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "accordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfume_accords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfume_tags" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfume_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "region" TEXT,
    "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "summaryProfile" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "rationaleJSON" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_perfumes" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "similarityScore" DOUBLE PRECISION,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_perfumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "perfumeId" TEXT NOT NULL,
    "like" BOOLEAN,
    "reasons" TEXT[],
    "text" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "similar_perfumes" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "similarPerfumeId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "similar_perfumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "perfumes_brand_name_idx" ON "perfumes"("brand", "name");

-- CreateIndex
CREATE INDEX "perfumes_priceRange_idx" ON "perfumes"("priceRange");

-- CreateIndex
CREATE INDEX "perfumes_popularityScore_idx" ON "perfumes"("popularityScore");

-- CreateIndex
CREATE UNIQUE INDEX "notes_name_key" ON "notes"("name");

-- CreateIndex
CREATE INDEX "notes_category_idx" ON "notes"("category");

-- CreateIndex
CREATE UNIQUE INDEX "accords_name_key" ON "accords"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "perfume_notes_perfumeId_idx" ON "perfume_notes"("perfumeId");

-- CreateIndex
CREATE INDEX "perfume_notes_noteId_idx" ON "perfume_notes"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "perfume_notes_perfumeId_noteId_position_key" ON "perfume_notes"("perfumeId", "noteId", "position");

-- CreateIndex
CREATE INDEX "perfume_accords_perfumeId_idx" ON "perfume_accords"("perfumeId");

-- CreateIndex
CREATE INDEX "perfume_accords_accordId_idx" ON "perfume_accords"("accordId");

-- CreateIndex
CREATE UNIQUE INDEX "perfume_accords_perfumeId_accordId_key" ON "perfume_accords"("perfumeId", "accordId");

-- CreateIndex
CREATE INDEX "perfume_tags_perfumeId_idx" ON "perfume_tags"("perfumeId");

-- CreateIndex
CREATE INDEX "perfume_tags_tagId_idx" ON "perfume_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "perfume_tags_perfumeId_tagId_key" ON "perfume_tags"("perfumeId", "tagId");

-- CreateIndex
CREATE INDEX "affiliate_links_perfumeId_idx" ON "affiliate_links"("perfumeId");

-- CreateIndex
CREATE INDEX "affiliate_links_platform_idx" ON "affiliate_links"("platform");

-- CreateIndex
CREATE INDEX "affiliate_links_isActive_idx" ON "affiliate_links"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_anonymousId_key" ON "sessions"("anonymousId");

-- CreateIndex
CREATE INDEX "sessions_anonymousId_idx" ON "sessions"("anonymousId");

-- CreateIndex
CREATE INDEX "sessions_createdAt_idx" ON "sessions"("createdAt");

-- CreateIndex
CREATE INDEX "conversations_sessionId_idx" ON "conversations"("sessionId");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_createdAt_idx" ON "conversations"("createdAt");

-- CreateIndex
CREATE INDEX "recommendations_conversationId_idx" ON "recommendations"("conversationId");

-- CreateIndex
CREATE INDEX "recommendation_perfumes_recommendationId_idx" ON "recommendation_perfumes"("recommendationId");

-- CreateIndex
CREATE INDEX "recommendation_perfumes_perfumeId_idx" ON "recommendation_perfumes"("perfumeId");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_perfumes_recommendationId_perfumeId_key" ON "recommendation_perfumes"("recommendationId", "perfumeId");

-- CreateIndex
CREATE INDEX "feedbacks_conversationId_idx" ON "feedbacks"("conversationId");

-- CreateIndex
CREATE INDEX "feedbacks_perfumeId_idx" ON "feedbacks"("perfumeId");

-- CreateIndex
CREATE INDEX "feedbacks_sessionId_idx" ON "feedbacks"("sessionId");

-- CreateIndex
CREATE INDEX "feedbacks_like_idx" ON "feedbacks"("like");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_sessionId_idx" ON "events"("sessionId");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "similar_perfumes_perfumeId_idx" ON "similar_perfumes"("perfumeId");

-- CreateIndex
CREATE INDEX "similar_perfumes_similarPerfumeId_idx" ON "similar_perfumes"("similarPerfumeId");

-- CreateIndex
CREATE UNIQUE INDEX "similar_perfumes_perfumeId_similarPerfumeId_key" ON "similar_perfumes"("perfumeId", "similarPerfumeId");

-- AddForeignKey
ALTER TABLE "perfume_notes" ADD CONSTRAINT "perfume_notes_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfume_notes" ADD CONSTRAINT "perfume_notes_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfume_accords" ADD CONSTRAINT "perfume_accords_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfume_accords" ADD CONSTRAINT "perfume_accords_accordId_fkey" FOREIGN KEY ("accordId") REFERENCES "accords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfume_tags" ADD CONSTRAINT "perfume_tags_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfume_tags" ADD CONSTRAINT "perfume_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_perfumes" ADD CONSTRAINT "recommendation_perfumes_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_perfumes" ADD CONSTRAINT "recommendation_perfumes_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "similar_perfumes" ADD CONSTRAINT "similar_perfumes_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "similar_perfumes" ADD CONSTRAINT "similar_perfumes_similarPerfumeId_fkey" FOREIGN KEY ("similarPerfumeId") REFERENCES "perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
