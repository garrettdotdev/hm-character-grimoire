import sqlite3 from 'sqlite3';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = './grimoire.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  getConnection(): sqlite3.Database {
    return this.db;
  }

  private initializeTables(): void {
    this.db.serialize(() => {
      // Create new normalized folders table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS folders_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_id INTEGER REFERENCES folders_new(id) ON DELETE CASCADE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(parent_id, name)
        )
      `);

      // Create new spells table with foreign key to folders
      this.db.run(`
        CREATE TABLE IF NOT EXISTS spells_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          convocation TEXT NOT NULL,
          complexity_level INTEGER NOT NULL,
          description TEXT NOT NULL,
          bonus_effects TEXT NOT NULL,
          casting_time TEXT NOT NULL,
          range TEXT NOT NULL,
          duration TEXT NOT NULL,
          folder_id INTEGER NOT NULL REFERENCES folders_new(id) ON DELETE RESTRICT,
          source_book TEXT NOT NULL DEFAULT '',
          source_page INTEGER NOT NULL DEFAULT 0
        )
      `);

      // Keep existing tables for migration
      this.db.run(`
        CREATE TABLE IF NOT EXISTS spells (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          convocation TEXT NOT NULL,
          complexity_level INTEGER NOT NULL,
          description TEXT NOT NULL,
          bonus_effects TEXT NOT NULL,
          casting_time TEXT NOT NULL,
          range TEXT NOT NULL,
          duration TEXT NOT NULL,
          folder_path TEXT NOT NULL DEFAULT '/',
          source_book TEXT NOT NULL DEFAULT '',
          source_page INTEGER NOT NULL DEFAULT 0
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          convocations TEXT NOT NULL,
          rank TEXT NOT NULL,
          game TEXT NOT NULL
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS character_spells (
          character_id TEXT,
          spell_id TEXT,
          PRIMARY KEY (character_id, spell_id),
          FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
          FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS folders (
          folder_path TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Perform migration if needed
      this.performMigration();
    });
  }

  private performMigration(): void {
    // Check if the new schema is already in place
    this.db.all("PRAGMA table_info(spells)", (err, rows: any[]) => {
      if (err) {
        console.error('Error checking table schema:', err);
        return;
      }

      // Check if the spells table has the folder_id column (new schema)
      const hasFolderId = rows && rows.some(row => row.name === 'folder_id');

      if (hasFolderId) {
        // New schema is already in place
        console.log('Database schema is up to date.');
        this.cleanupOldTables();
        return;
      }

      // Old schema detected, but since we're starting fresh, just log and continue
      console.log('Old schema detected, but database will be recreated with new schema.');
    });
  }

  private migrateData(): void {
    this.db.serialize(() => {
      // First, insert root folder
      this.db.run("INSERT OR IGNORE INTO folders_new (id, name, parent_id) VALUES (1, '', NULL)", (err) => {
        if (err) {
          console.error('Error creating root folder:', err);
          return;
        }

        // Get all unique folder paths from both tables
        this.db.all(`
          SELECT DISTINCT folder_path FROM (
            SELECT folder_path FROM folders
            UNION
            SELECT DISTINCT folder_path FROM spells WHERE folder_path != '/'
          ) ORDER BY folder_path
        `, (err, rows: any[]) => {
          if (err) {
            console.error('Error getting folder paths:', err);
            return;
          }

          // Create folder hierarchy
          this.createFolderHierarchy(rows.map(r => r.folder_path), () => {
            // Migrate spells
            this.migrateSpells(() => {
              console.log('Migration completed successfully!');
              this.switchToNewTables();
            });
          });
        });
      });
    });
  }

  private createFolderHierarchy(paths: string[], callback: () => void): void {
    // Sort paths by depth to ensure parents are created before children
    const sortedPaths = paths
      .filter(path => path !== '/')
      .sort((a, b) => a.split('/').length - b.split('/').length);

    let completed = 0;
    const total = sortedPaths.length;

    if (total === 0) {
      callback();
      return;
    }

    sortedPaths.forEach(path => {
      const parts = path.split('/').filter(p => p);
      const name = parts[parts.length - 1];
      const parentPath = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';

      // Get parent ID
      this.getFolderIdByPath(parentPath, (parentId) => {
        if (parentId !== null) {
          this.db.run(
            "INSERT OR IGNORE INTO folders_new (name, parent_id) VALUES (?, ?)",
            [name, parentId],
            (err) => {
              if (err) {
                console.error(`Error creating folder ${path}:`, err);
              }
              completed++;
              if (completed === total) {
                callback();
              }
            }
          );
        } else {
          console.error(`Parent not found for path: ${path}`);
          completed++;
          if (completed === total) {
            callback();
          }
        }
      });
    });
  }

  private getFolderIdByPath(path: string, callback: (id: number | null) => void): void {
    if (path === '/') {
      callback(1); // Root folder ID
      return;
    }

    const parts = path.split('/').filter(p => p);
    let currentId = 1; // Start from root
    let index = 0;

    const findNext = () => {
      if (index >= parts.length) {
        callback(currentId);
        return;
      }

      const name = parts[index];
      this.db.get(
        "SELECT id FROM folders_new WHERE name = ? AND parent_id = ?",
        [name, currentId],
        (err, row: any) => {
          if (err || !row) {
            callback(null);
            return;
          }
          currentId = row.id;
          index++;
          findNext();
        }
      );
    };

    findNext();
  }

  private migrateSpells(callback: () => void): void {
    this.db.all("SELECT * FROM spells", (err, rows: any[]) => {
      if (err) {
        console.error('Error getting spells:', err);
        callback();
        return;
      }

      let completed = 0;
      const total = rows.length;

      if (total === 0) {
        callback();
        return;
      }

      rows.forEach(spell => {
        this.getFolderIdByPath(spell.folder_path, (folderId) => {
          if (folderId !== null) {
            this.db.run(`
              INSERT INTO spells_new (
                id, name, convocation, complexity_level, description, bonus_effects,
                casting_time, range, duration, folder_id, source_book, source_page
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              spell.id, spell.name, spell.convocation, spell.complexity_level,
              spell.description, spell.bonus_effects, spell.casting_time,
              spell.range, spell.duration, folderId, spell.source_book, spell.source_page
            ], (err) => {
              if (err) {
                console.error(`Error migrating spell ${spell.name}:`, err);
              }
              completed++;
              if (completed === total) {
                callback();
              }
            });
          } else {
            console.error(`Folder not found for spell ${spell.name} with path ${spell.folder_path}`);
            completed++;
            if (completed === total) {
              callback();
            }
          }
        });
      });
    });
  }

  private switchToNewTables(): void {
    this.db.serialize(() => {
      // Check if old tables exist before renaming
      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='spells_old'", (err, row) => {
        if (!row) {
          // Only rename if old table doesn't exist
          this.db.run("ALTER TABLE spells RENAME TO spells_old", (err) => {
            if (err) console.log('Note: spells table already renamed or doesn\'t exist');
          });
        }
      });

      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='folders_old'", (err, row) => {
        if (!row) {
          // Only rename if old table doesn't exist
          this.db.run("ALTER TABLE folders RENAME TO folders_old", (err) => {
            if (err) console.log('Note: folders table already renamed or doesn\'t exist');
          });
        }
      });

      // Check if new tables exist before renaming
      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='spells_new'", (err, row) => {
        if (row) {
          this.db.run("ALTER TABLE spells_new RENAME TO spells", (err) => {
            if (err) console.log('Note: spells_new table already renamed or doesn\'t exist');
          });
        }
      });

      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='folders_new'", (err, row) => {
        if (row) {
          this.db.run("ALTER TABLE folders_new RENAME TO folders", (err) => {
            if (err) console.log('Note: folders_new table already renamed or doesn\'t exist');
          });
        }
      });

      console.log('Database schema migration completed!');
    });
  }

  private cleanupOldTables(): void {
    // Remove old tables if they exist
    this.db.run("DROP TABLE IF EXISTS spells_old", (err) => {
      if (err) console.log('Note: spells_old table cleanup skipped');
    });

    this.db.run("DROP TABLE IF EXISTS folders_old", (err) => {
      if (err) console.log('Note: folders_old table cleanup skipped');
    });

    this.db.run("DROP TABLE IF EXISTS spells_new", (err) => {
      if (err) console.log('Note: spells_new table cleanup skipped');
    });

    this.db.run("DROP TABLE IF EXISTS folders_new", (err) => {
      if (err) console.log('Note: folders_new table cleanup skipped');
    });
  }

  close(): void {
    this.db.close();
  }
}
