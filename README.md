# HarnMaster Character Grimoire

A spell reference tool for HarnMaster TTRPG players who play Shek-P'var (wizard) characters. This application allows players to quickly reference spell descriptions and manage their character's spell repertoire.

## About

This tool was originally built for personal use to help manage and reference spells during HarnMaster gameplay. It provides a clean, organized interface for browsing spell descriptions, organizing spells into folders, and tracking which spells each character knows.

- **Target Audience**: HarnMaster TTRPG players, specifically those playing Shek-P'var characters
- **Intended Use**: Local reference tool for personal use
- **Support**: This is a community tool provided as-is with no official support

## Features

- **Character Management**: Create and manage multiple Shek-P'var characters
- **Spell Library**: Browse and search through comprehensive spell databases
- **Spell Organization**: Organize spells into hierarchical folders by convocation or custom categories
- **Character Grimoires**: Track which spells each character knows
- **Spell Import**: Import spell data from CSV/JSON files
- **Local Storage**: All data stored locally using SQLite database

## Technology Stack

This is a full-stack web application built with:

### Frontend
- **React 19** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Zustand** for state management

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** with SQLite database
- **Zod** for validation

### Development
- **Turborepo** for monorepo management
- **pnpm** for package management
- **ESLint** and **Prettier** for code quality

## Project Structure

```
hmgrimoire/
├── apps/
│   ├── frontend/          # React web application
│   └── backend/           # Express API server
└── packages/
    ├── api-client/        # API client library
    ├── types/             # Shared TypeScript types
    ├── validation/        # Zod validation schemas
    ├── ui/                # Shared UI components
    ├── eslint-config/     # ESLint configurations
    └── typescript-config/ # TypeScript configurations

```

## Prerequisites

- **Node.js** 18 or higher
- **pnpm** 9.0.0 or higher

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hmgrimoire.git
   cd hmgrimoire
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the application**
   ```bash
   pnpm run start
   ```

4. **Access the application**
   - Frontend: http://localhost:4173
   - Backend API: http://localhost:3000

## Usage

### Getting Started
1. Create your first Shek-P'var character using the character sidebar (left side). Clicking a character in the character sidebar will display that character's grimoire.
2. Browse or search the spell library sidebar (right side).
3. Add spells to the spell library by clicking the "+" button and selecting "Add Spell".
4. Add spells to your character's grimoire by dragging and dropping from the spell library to the character's grimoire.
5. Click on a spell in the grimoire to view its details.

### Managing Characters
- Use the left sidebar to create, edit, and delete characters.
- Select a character to view and manage their spell repertoire.
- Character data includes name, convocation(s), guilde rank, and game information.

### Managing Spells
- Use the right sidebar to browse the spell library. It comes preloaded with all canon spells, plus a selection of spells from the Grand Grimoire, as well as a few spells I wrote.
- Use the existing folder structure (convocation and complexity level) or create folders to organize spells however you would like. You can move folders and spells in the spell library by dragging and dropping.
- Search and filter spells using the search functionality
- Spells can be imported from a JSON file.

### Importing Spells with JSON
- Click the "Import Spells" button in the spell library sidebar.
- Select a JSON file to import.

#### Expected JSON Format
```json
[
  {
    "name": "My Cool Spell",
    "convocation": "Lyahvi",
    "complexityLevel": 3,
    "description": "Full Spell Description",
    "bonusEffects": [
      {
        "masteryLevelMinimum": 60,
        "effectsDescription": "Full Description of Bonus Effect"
      },
      {
        "masteryLevelMinimum": 80,
        "effectsDescription": "Full Description of Bonus Effect"
      },
      ...
    ],
    "castingTime": "15–CSI seconds",
    "range": "Touch",
    "duration": "Instantaneous",
    "folderId": 1,
    "sourceBook": "HarnMaster Magic",
    "sourcePage": "Lyahvi 5"
  },
  ...
]
```

## Development

### Available Scripts

```bash
# Start both frontend and backend in development mode
pnpm dev

# Start only the backend
pnpm start:backend

# Start only the frontend
pnpm start:frontend

# Build all packages
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm check-types

# Stop all running processes
pnpm stop
```

### Database

The application uses SQLite with Prisma ORM. The database file (`grimoire.db`) is created automatically in the backend directory when you first run the application.

## Contributing

Contributions are welcome! If you have ideas for features that would make this tool more useful for the HarnMaster community:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the ISC License.

## Disclaimer

This is an unofficial community tool for HarnMaster players. It is not affiliated with or endorsed by Columbia Games or the official HarnMaster product line. All spell data and game mechanics referenced are the property of their respective copyright holders.

**No Support Provided**: This tool is provided as-is for the convenience of the HarnMaster community. No technical support, warranties, or guarantees are provided.
