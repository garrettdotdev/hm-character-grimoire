import { prismaService } from '../services/PrismaService.js';
import { PrismaSpellRepository } from '../repositories/PrismaSpellRepository.js';
import { PrismaCharacterRepository } from '../repositories/PrismaCharacterRepository.js';
import { PrismaFolderRepository } from '../repositories/PrismaFolderRepository.js';
import type { ISpellRepository } from '../repositories/ISpellRepository.js';
import type { ICharacterRepository } from '../repositories/ICharacterRepository.js';
import type { IFolderRepository } from '../repositories/IFolderRepository.js';
import { SpellService } from '../services/SpellService.js';
import { CharacterService } from '../services/CharacterService.js';
import { FolderService } from '../services/FolderService.js';
import { SpellController } from '../controllers/SpellController.js';
import { CharacterController } from '../controllers/CharacterController.js';
import { FolderController } from '../controllers/FolderController.js';

export class Container {
  private spellRepository: ISpellRepository;
  private characterRepository: ICharacterRepository;
  private folderRepository: IFolderRepository;
  private spellService: SpellService;
  private characterService: CharacterService;
  private folderService: FolderService;
  private spellController: SpellController;
  private characterController: CharacterController;
  private folderController: FolderController;

  constructor() {
    // Initialize repositories
    this.spellRepository = new PrismaSpellRepository();
    this.characterRepository = new PrismaCharacterRepository();
    this.folderRepository = new PrismaFolderRepository();

    // Initialize services
    this.spellService = new SpellService(this.spellRepository, this.folderRepository);
    this.characterService = new CharacterService(this.characterRepository, this.spellRepository);
    this.folderService = new FolderService(this.folderRepository, this.spellRepository);

    // Initialize controllers
    this.spellController = new SpellController(this.spellService);
    this.characterController = new CharacterController(this.characterService);
    this.folderController = new FolderController(this.folderService);
  }

  getSpellController(): SpellController {
    return this.spellController;
  }

  getCharacterController(): CharacterController {
    return this.characterController;
  }

  getFolderController(): FolderController {
    return this.folderController;
  }
}
