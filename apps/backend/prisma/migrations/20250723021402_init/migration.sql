-- CreateTable
CREATE TABLE "folders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spells" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "convocation" TEXT NOT NULL,
    "complexity_level" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "bonus_effects" TEXT NOT NULL,
    "casting_time" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "folder_id" INTEGER NOT NULL,
    "source_book" TEXT NOT NULL DEFAULT '',
    "source_page" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "spells_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "convocations" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "game" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CharacterSpells" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterSpells_A_fkey" FOREIGN KEY ("A") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterSpells_B_fkey" FOREIGN KEY ("B") REFERENCES "spells" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "folders_parent_id_name_key" ON "folders"("parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterSpells_AB_unique" ON "_CharacterSpells"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterSpells_B_index" ON "_CharacterSpells"("B");
