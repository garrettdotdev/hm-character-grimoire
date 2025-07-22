# HM Character Grimoire - Installation Instructions

This guide will help you set up and run the HM Character Grimoire application on your local machine. The application consists of a React frontend and Express backend, managed as a monorepo using pnpm workspaces.

## Prerequisites

Before you begin, you'll need to install the following software on your system:

1. **Git** - for cloning the repository
2. **Node.js** (version 18 or higher) - JavaScript runtime
3. **pnpm** - package manager

## Installation Instructions by Operating System

### macOS

#### 1. Install Git
Git comes pre-installed on most macOS systems. To verify:
```bash
git --version
```

If Git is not installed, install it via Xcode Command Line Tools:
```bash
xcode-select --install
```

#### 2. Install Node.js
**Option A: Using Homebrew (Recommended)**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**Option B: Download from Official Website**
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version for macOS
3. Run the installer and follow the prompts

#### 3. Install pnpm
```bash
npm install -g pnpm
```

### Windows

#### 1. Install Git
1. Download Git from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer with default settings
3. Verify installation by opening Command Prompt or PowerShell and running:
```cmd
git --version
```

#### 2. Install Node.js
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version for Windows
3. Run the installer and follow the prompts
4. Verify installation by opening Command Prompt or PowerShell and running:
```cmd
node --version
npm --version
```

#### 3. Install pnpm
Open Command Prompt or PowerShell as Administrator and run:
```cmd
npm install -g pnpm
```

### Linux (Ubuntu/Debian)

#### 1. Install Git
```bash
sudo apt update
sudo apt install git
```

#### 2. Install Node.js
**Option A: Using NodeSource Repository (Recommended)**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Option B: Using Package Manager (may have older version)**
```bash
sudo apt update
sudo apt install nodejs npm
```

#### 3. Install pnpm
```bash
npm install -g pnpm
```

### Linux (CentOS/RHEL/Fedora)

#### 1. Install Git
**CentOS/RHEL:**
```bash
sudo yum install git
```

**Fedora:**
```bash
sudo dnf install git
```

#### 2. Install Node.js
**Option A: Using NodeSource Repository (Recommended)**
```bash
# For CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install nodejs

# For Fedora
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs
```

#### 3. Install pnpm
```bash
npm install -g pnpm
```

## Setting Up the Application

Once you have all prerequisites installed, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/garrettdotdev/hm-character-grimoire.git
cd hm-character-grimoire
```

### 2. Install Dependencies
```bash
pnpm install
```

This command will install all dependencies for the entire monorepo, including both frontend and backend packages.

### 3. Start the Application
```bash
pnpm start
```

This will start both the backend server and frontend development server concurrently.

### 4. Access the Application
- **Frontend**: Open your web browser and navigate to `http://localhost:4173`
- **Backend API**: The API server will be running on `http://localhost:3000`

## Alternative Start Commands

If you need to run the frontend and backend separately:

**Start only the backend:**
```bash
pnpm start:backend
```

**Start only the frontend:**
```bash
pnpm start:frontend
```

**Stop all running processes:**
```bash
pnpm stop
```

## Troubleshooting

### Common Issues

1. **Port already in use**: If you get an error about ports being in use, make sure no other applications are running on ports 3000 (backend) or 4173 (frontend).

2. **Permission errors on Linux/macOS**: If you get permission errors when installing pnpm globally, you may need to configure npm to use a different directory or use a Node version manager like nvm.

3. **Node version issues**: Ensure you're using Node.js version 18 or higher:
   ```bash
   node --version
   ```

4. **pnpm not found**: If pnpm command is not recognized, try restarting your terminal or adding the npm global bin directory to your PATH.

### Getting Help

If you encounter issues not covered here:
1. Check that all prerequisites are properly installed
2. Ensure you're in the correct directory (`hm-character-grimoire`)
3. Try deleting `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again
4. Check the terminal output for specific error messages

## Development

For development work:
- Use `pnpm dev` to start both frontend and backend in development mode with hot reloading
- Use `pnpm build` to build the entire project for production
- Use `pnpm lint` to run linting checks
- Use `pnpm format` to format code with Prettier

Enjoy using the HM Character Grimoire!

