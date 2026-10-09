-- PK: UUIDv7 gerado pela aplicação (Prisma `uuid(7)`), sem default no banco.
-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- E-mail único só entre usuários ativos (exclusão lógica). Índice parcial: escrito à mão.
CREATE UNIQUE INDEX "users_email_active_uidx" ON "users"("email") WHERE "deleted_at" IS NULL;
