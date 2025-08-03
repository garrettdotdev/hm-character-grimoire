import { useState } from "react";
import { Modal } from "./Modal";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { ErrorModal } from "./ErrorModal";
import { api } from "../services/api";

interface ErrorTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ErrorTestModal({ isOpen, onClose }: ErrorTestModalProps) {
  const [loading, setLoading] = useState(false);
  const { errorInfo, showErrorModal, handleApiError, clearError } = useErrorHandler();

  const testDuplicateSpell = async () => {
    setLoading(true);
    try {
      // First, create a test spell
      const testSpell = {
        name: "Test Duplicate Spell",
        convocation: "Neutral" as const,
        complexityLevel: 1,
        description: "A test spell for duplicate testing",
        bonusEffects: [],
        castingTime: "1 action",
        range: "Touch",
        duration: "Instantaneous",
        folderId: 1,
        sourceBook: "Test Book",
        sourcePage: "1"
      };

      await api.createSpell(testSpell);
      
      // Now try to create the same spell again (should fail)
      await api.createSpell(testSpell);
    } catch (error) {
      handleApiError(error as any, "Testing duplicate spell creation");
    } finally {
      setLoading(false);
    }
  };

  const testImportWithDuplicates = async () => {
    setLoading(true);
    try {
      const importSpells = [
        {
          name: "Import Test Spell 1",
          convocation: "Neutral" as const,
          complexityLevel: 1,
          description: "First import test spell",
          bonusEffects: [],
          castingTime: "1 action",
          range: "Touch",
          duration: "Instantaneous",
          folderId: 1,
          sourceBook: "Test Book",
          sourcePage: "2"
        },
        {
          name: "Test Duplicate Spell", // This should conflict if the previous test created it
          convocation: "Neutral" as const,
          complexityLevel: 2,
          description: "Duplicate name test",
          bonusEffects: [],
          castingTime: "1 action",
          range: "Touch",
          duration: "Instantaneous",
          folderId: 1,
          sourceBook: "Test Book",
          sourcePage: "3"
        },
        {
          name: "Import Test Spell 2",
          convocation: "Neutral" as const,
          complexityLevel: 1,
          description: "Second import test spell",
          bonusEffects: [],
          castingTime: "1 action",
          range: "Touch",
          duration: "Instantaneous",
          folderId: 1,
          sourceBook: "Test Book",
          sourcePage: "4"
        }
      ];

      await api.importSpells({ spells: importSpells });
    } catch (error) {
      handleApiError(error as any, "Testing import with duplicates");
    } finally {
      setLoading(false);
    }
  };

  const testInvalidFolder = async () => {
    setLoading(true);
    try {
      const testSpell = {
        name: "Test Invalid Folder Spell",
        convocation: "Neutral" as const,
        complexityLevel: 1,
        description: "A test spell with invalid folder",
        bonusEffects: [],
        castingTime: "1 action",
        range: "Touch",
        duration: "Instantaneous",
        folderId: 99999, // Non-existent folder
        sourceBook: "Test Book",
        sourcePage: "1"
      };

      await api.createSpell(testSpell);
    } catch (error) {
      handleApiError(error as any, "Testing invalid folder reference");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Error Handling Test" size="lg">
        <div className="space-y-6">
          <p className="text-gray-300">
            Use these buttons to test different error scenarios and see how they're displayed in the error modal.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Conflict Errors</h3>
              <button
                onClick={testDuplicateSpell}
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? "Testing..." : "Test Duplicate Spell Name"}
              </button>
              <p className="text-sm text-gray-400 mt-1">
                Creates a spell, then tries to create another with the same name.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Import Errors</h3>
              <button
                onClick={testImportWithDuplicates}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? "Testing..." : "Test Import with Duplicates"}
              </button>
              <p className="text-sm text-gray-400 mt-1">
                Imports multiple spells where some may have duplicate names.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Validation Errors</h3>
              <button
                onClick={testInvalidFolder}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? "Testing..." : "Test Invalid Folder Reference"}
              </button>
              <p className="text-sm text-gray-400 mt-1">
                Tries to create a spell with a non-existent folder ID.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      {errorInfo && (
        <ErrorModal
          isOpen={showErrorModal}
          onClose={clearError}
          error={errorInfo}
        />
      )}
    </>
  );
}
