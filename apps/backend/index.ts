// apps/backend/index.ts
import express from 'express';
import cors from 'cors';
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

app.get('/api/characters/:id/spells', async (req, res) => {
    try {
        const spells = await dataStore.getSpellsForCharacter(req.params.id);
        res.json({ spells });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch character spells' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`HarnMaster Grimoire API running on http://localhost:${PORT}`);
});
