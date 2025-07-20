// apps/backend/index.ts
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { dataStore } from './data/store.js';

const app = express();
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'HarnMaster Grimoire API is running' });
});

// Spell routes
app.get('/api/spells', async (req, res) => {
    try {
        const spells = await dataStore.getAllSpells();
        res.json({ spells });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch spells' });
    }
});

app.get('/api/spells/:id', async (req, res) => {
    try {
        const spell = await dataStore.getSpellById(req.params.id);
        if (spell) {
            res.json(spell);
        } else {
            res.status(404).json({ error: 'Spell not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch spell' });
    }
});

app.post('/api/spells', async (req, res) => {
    try {
        const { name, convocation, complexityLevel, description, bonusEffects, castingTime, range, duration } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Spell name is required' });
        }
        if (!convocation) {
            return res.status(400).json({ error: 'Spell convocation is required' });
        }
        if (!complexityLevel || complexityLevel < 1) {
            return res.status(400).json({ error: 'Valid complexity level is required (minimum 1)' });
        }
        if (!description) {
            return res.status(400).json({ error: 'Spell description is required' });
        }

        const spell = {
            id: crypto.randomUUID(),
            name,
            convocation,
            complexityLevel: parseInt(complexityLevel),
            description,
            bonusEffects: bonusEffects || [],
            castingTime: castingTime || '',
            range: range || '',
            duration: duration || ''
        };

        await dataStore.addSpell(spell);
        res.status(201).json(spell);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create spell' });
    }
});

app.put('/api/spells/:id', async (req, res) => {
    try {
        const { name, convocation, complexityLevel, description, bonusEffects, castingTime, range, duration } = req.body;
        const spellId = req.params.id;

        if (!name) {
            return res.status(400).json({ error: 'Spell name is required' });
        }
        if (!convocation) {
            return res.status(400).json({ error: 'Spell convocation is required' });
        }
        if (!complexityLevel || complexityLevel < 1) {
            return res.status(400).json({ error: 'Valid complexity level is required (minimum 1)' });
        }
        if (!description) {
            return res.status(400).json({ error: 'Spell description is required' });
        }

        // Check if spell exists
        const existingSpell = await dataStore.getSpellById(spellId);
        if (!existingSpell) {
            return res.status(404).json({ error: 'Spell not found' });
        }

        const updatedSpell = {
            ...existingSpell,
            name,
            convocation,
            complexityLevel: parseInt(complexityLevel),
            description,
            bonusEffects: bonusEffects || [],
            castingTime: castingTime || '',
            range: range || '',
            duration: duration || ''
        };

        await dataStore.updateSpell(updatedSpell);
        res.json(updatedSpell);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update spell' });
    }
});

app.delete('/api/spells/:id', async (req, res) => {
    try {
        const spellId = req.params.id;

        // Check if spell exists
        const existingSpell = await dataStore.getSpellById(spellId);
        if (!existingSpell) {
            return res.status(404).json({ error: 'Spell not found' });
        }

        await dataStore.deleteSpell(spellId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete spell' });
    }
});

// Character routes
app.get('/api/characters', async (req, res) => {
    try {
        const characters = await dataStore.getAllCharacters();
        res.json({ characters });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch characters' });
    }
});

app.get('/api/characters/:id', async (req, res) => {
    try {
        const character = await dataStore.getCharacterById(req.params.id);
        if (character) {
            res.json(character);
        } else {
            res.status(404).json({ error: 'Character not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch character' });
    }
});

app.post('/api/characters', async (req, res) => {
    try {
        const { name, convocations, rank, game } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Character name is required' });
        }
        if (!convocations || !Array.isArray(convocations) || convocations.length === 0) {
            return res.status(400).json({ error: 'At least one convocation is required' });
        }
        if (!rank) {
            return res.status(400).json({ error: 'Character rank is required' });
        }

        const character = {
            id: crypto.randomUUID(),
            name,
            convocations,
            rank,
            game: game || '',
            knownSpellIds: []
        };

        await dataStore.addCharacter(character);
        res.status(201).json(character);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create character' });
    }
});

app.put('/api/characters/:id', async (req, res) => {
    try {
        const { name, convocations, rank, game } = req.body;
        const characterId = req.params.id;

        if (!name) {
            return res.status(400).json({ error: 'Character name is required' });
        }
        if (!convocations || !Array.isArray(convocations) || convocations.length === 0) {
            return res.status(400).json({ error: 'At least one convocation is required' });
        }
        if (!rank) {
            return res.status(400).json({ error: 'Character rank is required' });
        }

        // Check if character exists
        const existingCharacter = await dataStore.getCharacterById(characterId);
        if (!existingCharacter) {
            return res.status(404).json({ error: 'Character not found' });
        }

        const updatedCharacter = {
            ...existingCharacter,
            name,
            convocations,
            rank,
            game: game || ''
        };

        await dataStore.updateCharacter(updatedCharacter);
        res.json(updatedCharacter);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update character' });
    }
});

app.delete('/api/characters/:id', async (req, res) => {
    try {
        const characterId = req.params.id;

        // Check if character exists
        const existingCharacter = await dataStore.getCharacterById(characterId);
        if (!existingCharacter) {
            return res.status(404).json({ error: 'Character not found' });
        }

        await dataStore.deleteCharacter(characterId);
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete character' });
    }
});

app.get('/api/characters/:id/spells', async (req, res) => {
    try {
        const spells = await dataStore.getSpellsForCharacter(req.params.id);
        res.json({ spells });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch character spells' });
    }
});

app.post('/api/characters/:id/spells', async (req, res) => {
    try {
        const characterId = req.params.id;
        const { spellId } = req.body;

        if (!spellId) {
            return res.status(400).json({ error: 'Spell ID is required' });
        }

        // Check if character exists
        const character = await dataStore.getCharacterById(characterId);
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        // Check if spell exists
        const spell = await dataStore.getSpellById(spellId);
        if (!spell) {
            return res.status(404).json({ error: 'Spell not found' });
        }

        // Check if character already knows this spell
        if (character.knownSpellIds.includes(spellId)) {
            return res.status(409).json({ error: 'Character already knows this spell' });
        }

        await dataStore.addSpellToCharacter(characterId, spellId);
        res.status(201).json({ message: 'Spell added to character successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add spell to character' });
    }
});

app.delete('/api/characters/:id/spells/:spellId', async (req, res) => {
    try {
        const characterId = req.params.id;
        const spellId = req.params.spellId;

        // Check if character exists
        const character = await dataStore.getCharacterById(characterId);
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        // Check if character knows this spell
        if (!character.knownSpellIds.includes(spellId)) {
            return res.status(404).json({ error: 'Character does not know this spell' });
        }

        await dataStore.removeSpellFromCharacter(characterId, spellId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove spell from character' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`HarnMaster Grimoire API running on http://localhost:${PORT}`);
});
