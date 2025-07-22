import { useState, useEffect } from "react";
import { type Character, type Spell, SpellConvocation } from "@repo/types";
import { SpellCard } from "./SpellCard";
import { SpellDetailsModal } from "./SpellDetailsModal.tsx";

interface MainContentProps {
  selectedCharacter: Character | null;
  onAddSpellToCharacter?: (spellId: string) => Promise<void>;
  onRemoveSpellFromCharacter?: (spellId: string) => Promise<void>;
  refreshTrigger?: number; // Add this to force refresh when changed
}

export function MainContent({
  selectedCharacter,
  onAddSpellToCharacter,
  onRemoveSpellFromCharacter,
  refreshTrigger,
}: MainContentProps) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvocation, setSelectedConvocation] = useState<string>("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "complexity">("name");
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const convocations = Object.values(SpellConvocation);

  useEffect(() => {
    if (selectedCharacter) {
      fetchCharacterSpells(selectedCharacter.id);
    } else {
      setSpells([]);
      setFilteredSpells([]);
    }
  }, [selectedCharacter, refreshTrigger]); // Add refreshTrigger as dependency

  useEffect(() => {
    filterSpells();
  }, [spells, searchTerm, selectedConvocation, selectedComplexity, sortBy]);

  const fetchCharacterSpells = async (characterId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/characters/${characterId}/spells`);
      const data = await response.json();
      setSpells(data.spells || []);
    } catch (error) {
      console.error("Failed to fetch character spells:", error);
      setSpells([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSpells = () => {
    let filtered = spells;

    if (searchTerm) {
      filtered = filtered.filter(
        (spell) =>
          spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          spell.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedConvocation !== "all") {
      filtered = filtered.filter(
        (spell) => spell.convocation === selectedConvocation,
      );
    }

    if (selectedComplexity !== "all") {
      filtered = filtered.filter(
        (spell) => spell.complexityLevel.toString() === selectedComplexity,
      );
    }

    setFilteredSpells(filtered);
  };

  // Group spells by convocation and sort within each group
  const getGroupedAndSortedSpells = () => {
    const grouped: { [convocation: string]: Spell[] } = {};

    // Group spells by convocation
    filteredSpells.forEach((spell) => {
      if (!grouped[spell.convocation]) {
        grouped[spell.convocation] = [];
      }
      grouped[spell.convocation].push(spell);
    });

    // Sort spells within each convocation group
    Object.keys(grouped).forEach((convocation) => {
      grouped[convocation].sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        } else {
          // First compare by complexity level
          const complexityDiff = a.complexityLevel - b.complexityLevel;
          if (complexityDiff !== 0) return complexityDiff;
          // If complexity is equal, sort by name
          return a.complexityLevel - b.complexityLevel;
        }
      });
    });

    // Sort convocations alphabetically
    const sortedConvocations = Object.keys(grouped).sort();

    return sortedConvocations.map((convocation) => ({
      convocation,
      spells: grouped[convocation],
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!selectedCharacter || !onAddSpellToCharacter) return;

    try {
      const spellData = JSON.parse(e.dataTransfer.getData("application/json"));
      console.log(
        "Dropping spell on character:",
        spellData.name,
        "to",
        selectedCharacter.name,
      );
      await onAddSpellToCharacter(spellData.id);
    } catch (error) {
      console.error("Failed to add spell to character:", error);
    }
  };

  const handleRemoveSpell = async (spellId: string) => {
    if (!selectedCharacter || !onRemoveSpellFromCharacter) return;

    try {
      await onRemoveSpellFromCharacter(spellId);
    } catch (error) {
      console.error("Failed to remove spell from character:", error);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex gap-4 items-center flex-wrap h-[76px]">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedConvocation}
            onChange={(e) => setSelectedConvocation(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Convocations</option>
            {convocations.map((conv) => (
              <option key={conv} value={conv}>
                {conv}
              </option>
            ))}
          </select>

          <select
            value={selectedComplexity}
            onChange={(e) => setSelectedComplexity(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Complexity</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <option key={level} value={level.toString()}>
                Level {level}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "complexity")}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="complexity">Sort by Complexity</option>
          </select>
        </div>
      </div>

      <div
        className={`flex-1 p-4 overflow-y-auto transition-colors relative ${
          isDragOver
            ? "bg-blue-900/20 border-2 border-dashed border-blue-500"
            : ""
        }`}
        onDragOver={selectedCharacter ? handleDragOver : undefined}
        onDragLeave={selectedCharacter ? handleDragLeave : undefined}
        onDrop={selectedCharacter ? handleDrop : undefined}
      >
        {!selectedCharacter ? (
          <div className="flex items-center justify-center h-full text-gray-400 italic">
            Select a character to view their spells
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 italic">
            Loading spells...
          </div>
        ) : filteredSpells.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 italic mb-4">
                {selectedCharacter.name} doesn't know any spells yet
              </div>
              <div className="text-gray-500 text-sm">
                Drag spells from the right sidebar to add them to this
                character's grimoire
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {getGroupedAndSortedSpells().map(({ convocation, spells }) => (
              <div key={convocation} className="space-y-4">
                {/* Convocation Section Header */}
                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-600"></div>
                  <h2 className="px-6 text-xl font-semibold text-white text-center">
                    {convocation}
                  </h2>
                  <div className="flex-1 border-t border-gray-600"></div>
                </div>

                {/* Spell Cards Grid */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                  {spells.map((spell) => (
                    <SpellCard
                      key={spell.id}
                      spell={spell}
                      size="medium"
                      onRemove={() => handleRemoveSpell(spell.id)}
                      onClick={() => setSelectedSpell(spell)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spell Details Modal */}
        {selectedSpell && (
          <SpellDetailsModal
            spell={selectedSpell}
            onClose={() => setSelectedSpell(null)}
            isOpen={!!selectedSpell}
          />
        )}

        {/* Drop zone indicator */}
        {isDragOver && selectedCharacter && (
          <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
              Drop spell here to add to {selectedCharacter.name}'s grimoire
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
