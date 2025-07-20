import sqlite3 from 'sqlite3';
import { Spell, SpellConvocation, BonusEffect } from '../models/Spell.js';
import { Character } from '../models/Character.js';

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
                    duration TEXT NOT NULL
                )
            `);

            this.db.run(`
                CREATE TABLE IF NOT EXISTS characters (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    occupation TEXT NOT NULL,
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
                INSERT INTO spells (id, name, convocation, complexity_level, description, bonus_effects, casting_time, range, duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                spell.duration
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
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
                    INSERT INTO characters (id, name, occupation, game)
                    VALUES (?, ?, ?, ?)
                `);
                stmt.run([character.id, character.name, character.occupation, character.game], (err) => {
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
            duration: row.duration
        };
    }

    private async rowToCharacter(row: any): Promise<Character> {
        const knownSpellIds = await this.getKnownSpellIds(row.id);
        return {
            id: row.id,
            name: row.name,
            occupation: row.occupation,
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