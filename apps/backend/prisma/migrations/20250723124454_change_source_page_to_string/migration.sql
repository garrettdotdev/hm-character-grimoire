-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_spells" (
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
    "source_page" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "spells_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_spells" ("bonus_effects", "casting_time", "complexity_level", "convocation", "description", "duration", "folder_id", "id", "name", "range", "source_book", "source_page") SELECT "bonus_effects", "casting_time", "complexity_level", "convocation", "description", "duration", "folder_id", "id", "name", "range", "source_book", "source_page" FROM "spells";
DROP TABLE "spells";
ALTER TABLE "new_spells" RENAME TO "spells";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
