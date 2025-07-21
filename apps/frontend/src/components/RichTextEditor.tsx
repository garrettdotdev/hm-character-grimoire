import { useState, useEffect } from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description with markdown formatting...",
  disabled = false,
  error = false
}: RichTextEditorProps) {
  const [editorValue, setEditorValue] = useState(value)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    setEditorValue(value)
  }, [value])

  const handleChange = (val: string) => {
    setEditorValue(val)
    onChange(val)
  }

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('.rich-text-editor textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editorValue.substring(start, end)
    const newText = editorValue.substring(0, start) + before + selectedText + after + editorValue.substring(end)

    handleChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  return (
    <div className={`rich-text-editor ${error ? 'error' : ''}`}>
      {/* Toolbar */}
      <div className="bg-gray-700 border border-gray-600 border-b-0 rounded-t-md px-3 py-2 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => insertMarkdown('**', '**')}
          disabled={disabled}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('*', '*')}
          disabled={disabled}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('`', '`')}
          disabled={disabled}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors font-mono"
          title="Code"
        >
          {'</>'}
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('\n\n### ', '')}
          disabled={disabled}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Header"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('\n\n- ', '')}
          disabled={disabled}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('\n\n> ', '')}
          disabled={disabled}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Quote"
        >
          "
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            disabled={disabled}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors"
            title={showPreview ? "Edit" : "Preview"}
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      {showPreview ? (
        <div className={`border border-gray-600 border-t-0 rounded-b-md bg-gray-700 p-3 min-h-[200px] ${error ? 'border-red-500' : ''}`}>
          <MarkdownRenderer
            content={editorValue}
            className="text-gray-300"
          />
        </div>
      ) : (
        <textarea
          value={editorValue}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className={`w-full p-3 bg-gray-700 text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-600'
          }`}
          style={{
            minHeight: '200px',
            borderTop: 'none',
            borderRadius: '0 0 0.375rem 0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
        />
      )}
    </div>
  )
}
