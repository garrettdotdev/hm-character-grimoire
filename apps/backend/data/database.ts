import sqlite3 from 'sqlite3';
import { Spell, SpellConvocation, BonusEffect } from '../models/Spell.js';
import { Character, CharacterRank } from '../models/Character.js';

export class Database {
    private db: sqlite3.Database;

    constructor(dbPath: string = './grimoire.db') {
        this.db = new sqlite3.Database(dbPath);
        this.initializeTables();
    }

    private initializeTables(): void {
        this.db.serialize(() => {
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
        });
    }

    // Spell methods
    getAllSpells(): Promise<Spell[]> {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM spells', (err, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows.map(this.rowToSpell));
            });
        });
    }

    getSpellById(id: string): Promise<Spell | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM spells WHERE id = ?', [id], (err, row: any) => {
                if (err) reject(err);
                else resolve(row ? this.rowToSpell(row) : undefined);
            });
        });
    }

    addSpell(spell: Spell): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO spells (id, name, convocation, complexity_level, description, bonus_effects, casting_time, range, duration, folder_path, source_book, source_page)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run([
                spell.id,
                spell.name,
                spell.convocation,
                spell.complexityLevel,
                spell.description,
                JSON.stringify(spell.bonusEffects),
                spell.castingTime,
                spell.range,
                spell.duration,
                spell.folderPath || '/',
                spell.sourceBook || '',
                spell.sourcePage || 0
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    updateSpell(spell: Spell): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE spells
                SET name = ?, convocation = ?, complexity_level = ?, description = ?,
                    bonus_effects = ?, casting_time = ?, range = ?, duration = ?, folder_path = ?,
                    source_book = ?, source_page = ?
                WHERE id = ?
            `);
            stmt.run([
                spell.name,
                spell.convocation,
                spell.complexityLevel,
                spell.description,
                JSON.stringify(spell.bonusEffects),
                spell.castingTime,
                spell.range,
                spell.duration,
                spell.folderPath || '/',
                spell.sourceBook || '',
                spell.sourcePage || 0,
                spell.id
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    deleteSpell(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // First delete character-spell relationships
                this.db.run('DELETE FROM character_spells WHERE spell_id = ?', [id], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Then delete the spell
                    this.db.run('DELETE FROM spells WHERE id = ?', [id], (deleteErr) => {
                        if (deleteErr) {
                            reject(deleteErr);
                            return;
                        }
                        resolve();
                    });
                });
            });
        });
    }

    addSpellToCharacter(characterId: string, spellId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('INSERT INTO character_spells (character_id, spell_id) VALUES (?, ?)');
            stmt.run([characterId, spellId], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    removeSpellFromCharacter(characterId: string, spellId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('DELETE FROM character_spells WHERE character_id = ? AND spell_id = ?');
            stmt.run([characterId, spellId], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    getAllFolders(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            // Get folders from both the folders table and spell folder paths
            this.db.all(`
                SELECT DISTINCT folder_path FROM (
                    SELECT folder_path FROM folders
                    UNION
                    SELECT DISTINCT folder_path FROM spells WHERE folder_path != '/'
                ) ORDER BY folder_path
            `, (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.folder_path));
                }
            });
        });
    }

    createFolder(folderPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('INSERT OR IGNORE INTO folders (folder_path) VALUES (?)');
            stmt.run([folderPath], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    renameFolder(oldPath: string, newPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Update folder paths in spells
                this.db.run('UPDATE spells SET folder_path = ? WHERE folder_path = ?', [newPath, oldPath], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Update folder paths in folders table
                    this.db.run('UPDATE folders SET folder_path = ? WHERE folder_path = ?', [newPath, oldPath], (updateErr) => {
                        if (updateErr) {
                            reject(updateErr);
                            return;
                        }
                        resolve();
                    });
                });
            });
        });
    }

    deleteFolder(folderPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Move all spells in this folder to parent folder
                const parentPath = folderPath.lastIndexOf('/') > 0
                    ? folderPath.substring(0, folderPath.lastIndexOf('/'))
                    : '/';

                this.db.run(
                    'UPDATE spells SET folder_path = ? WHERE folder_path = ?',
                    [parentPath, folderPath],
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Delete the folder record
                        this.db.run('DELETE FROM folders WHERE folder_path = ?', [folderPath], (deleteErr) => {
                            if (deleteErr) {
                                reject(deleteErr);
                                return;
                            }
                            resolve();
                        });
                    }
                );
            });
        });
    }

    // Character methods
    getAllCharacters(): Promise<Character[]> {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM characters', async (err, rows: any[]) => {
                if (err) reject(err);
                else {
                    const characters = await Promise.all(
                        rows.map(async (row) => await this.rowToCharacter(row))
                    );
                    resolve(characters);
                }
            });
        });
    }

    getCharacterById(id: string): Promise<Character | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM characters WHERE id = ?', [id], async (err, row: any) => {
                if (err) reject(err);
                else resolve(row ? await this.rowToCharacter(row) : undefined);
            });
        });
    }

    addCharacter(character: Character): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const stmt = this.db.prepare(`
                    INSERT INTO characters (id, name, convocations, rank, game)
                    VALUES (?, ?, ?, ?, ?)
                `);
                stmt.run([character.id, character.name, JSON.stringify(character.convocations), character.rank, character.game], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Add spell relationships
                    if (character.knownSpellIds.length > 0) {
                        const spellStmt = this.db.prepare('INSERT INTO character_spells (character_id, spell_id) VALUES (?, ?)');
                        character.knownSpellIds.forEach(spellId => {
                            spellStmt.run([character.id, spellId]);
                        });
                        spellStmt.finalize();
                    }
                    resolve();
                });
                stmt.finalize();
            });
        });
    }

    updateCharacter(character: Character): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const stmt = this.db.prepare(`
                    UPDATE characters
                    SET name = ?, convocations = ?, rank = ?, game = ?
                    WHERE id = ?
                `);
                stmt.run([character.name, JSON.stringify(character.convocations), character.rank, character.game, character.id], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Update spell relationships - remove existing and add new ones
                    this.db.run('DELETE FROM character_spells WHERE character_id = ?', [character.id], (deleteErr) => {
                        if (deleteErr) {
                            reject(deleteErr);
                            return;
                        }

                        if (character.knownSpellIds.length > 0) {
                            const spellStmt = this.db.prepare('INSERT INTO character_spells (character_id, spell_id) VALUES (?, ?)');
                            character.knownSpellIds.forEach(spellId => {
                                spellStmt.run([character.id, spellId]);
                            });
                            spellStmt.finalize();
                        }
                        resolve();
                    });
                });
                stmt.finalize();
            });
        });
    }

    deleteCharacter(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // First delete character-spell relationships
                this.db.run('DELETE FROM character_spells WHERE character_id = ?', [id], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Then delete the character
                    this.db.run('DELETE FROM characters WHERE id = ?', [id], (deleteErr) => {
                        if (deleteErr) {
                            reject(deleteErr);
                            return;
                        }
                        resolve();
                    });
                });
            });
        });
    }

    getSpellsForCharacter(characterId: string): Promise<Spell[]> {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT s.* FROM spells s
                JOIN character_spells cs ON s.id = cs.spell_id
                WHERE cs.character_id = ?
            `;
            this.db.all(query, [characterId], (err, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows.map(this.rowToSpell));
            });
        });
    }

    private rowToSpell(row: any): Spell {
        return {
            id: row.id,
            name: row.name,
            convocation: row.convocation as SpellConvocation,
            complexityLevel: row.complexity_level,
            description: row.description,
            bonusEffects: JSON.parse(row.bonus_effects) as BonusEffect[],
            castingTime: row.casting_time,
            range: row.range,
            duration: row.duration,
            folderPath: row.folder_path || '/',
            sourceBook: row.source_book || '',
            sourcePage: row.source_page || 0
        };
    }

    private async rowToCharacter(row: any): Promise<Character> {
        const knownSpellIds = await this.getKnownSpellIds(row.id);
        return {
            id: row.id,
            name: row.name,
            convocations: JSON.parse(row.convocations) as SpellConvocation[],
            rank: row.rank as CharacterRank,
            game: row.game,
            knownSpellIds
        };
    }

    private getKnownSpellIds(characterId: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT spell_id FROM character_spells WHERE character_id = ?',
                [characterId],
                (err, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.spell_id));
                }
            );
        });
    }

    close(): void {
        this.db.close();
    }
}

export const database = new Database();