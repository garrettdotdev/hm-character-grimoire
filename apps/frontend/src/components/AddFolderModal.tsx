import { useState, useEffect } from 'react'

interface AddFolderModalProps {
  onSave: (folderPath: string) => Promise<void>
  onCancel: () => void
  loading?: boolean
  allFolders: string[]
}

export function AddFolderModal({
  onSave,
  onCancel,
  loading = false,
  allFolders
}: AddFolderModalProps) {
  const [folderPath, setFolderPath] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Clear error when user starts typing
    if (error && folderPath) {
      setError('')
    }
  }, [folderPath, error])

  const validateFolderPath = (path: string): string | null => {
    if (!path.trim()) {
      return 'Folder path is required'
    }

    let cleanPath = path.trim()
    
    // Ensure it starts with /
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath
    }
    
    // Remove trailing slash unless it's root
    if (cleanPath !== '/' && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1)
    }

    // Check for invalid characters
    if (!/^\/[a-zA-Z0-9_\-\/\s]*$/.test(cleanPath)) {
      return 'Folder path contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores.'
    }

    // Check if folder already exists
    if (allFolders.includes(cleanPath)) {
      return 'A folder with this path already exists'
    }

    // Check for empty folder names
    const parts = cleanPath.split('/').filter(Boolean)
    if (parts.some(part => !part.trim())) {
      return 'Folder names cannot be empty'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateFolderPath(folderPath)
    if (validationError) {
      setError(validationError)
      return
    }

    let cleanPath = folderPath.trim()
    
    // Ensure it starts with /
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath
    }
    
    // Remove trailing slash unless it's root
    if (cleanPath !== '/' && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1)
    }

    try {
      await onSave(cleanPath)
    } catch (error) {
      console.error('Failed to create folder:', error)
      setError('Failed to create folder. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="folderPath" className="block text-sm font-medium text-gray-300 mb-1">
          Folder Path *
        </label>
        <input
          type="text"
          id="folderPath"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="e.g., /Combat/Offensive or /Utility"
          disabled={loading}
          autoFocus
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Use forward slashes (/) to create nested folders. Example: /Combat/Offensive
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Examples:</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li><code>/Combat</code> - Creates a Combat folder</li>
          <li><code>/Combat/Offensive</code> - Creates Offensive folder inside Combat</li>
          <li><code>/Utility/Divination</code> - Creates nested folders</li>
        </ul>
      </div>

      {allFolders.length > 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded p-3">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Existing Folders:</h4>
          <div className="max-h-32 overflow-y-auto">
            <ul className="text-xs text-gray-400 space-y-1">
              {allFolders.filter(f => f !== '/').map(folder => (
                <li key={folder}><code>{folder}</code></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !folderPath.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors"
        >
          {loading ? 'Creating...' : 'Create Folder'}
        </button>
      </div>
    </form>
  )
}
