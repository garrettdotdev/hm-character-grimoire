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
  const [editorHeight, setEditorHeight] = useState(200)
  const [isResizing, setIsResizing] = useState(false)

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

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startY = e.clientY
    const startHeight = editorHeight

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const newHeight = Math.max(100, Math.min(600, startHeight + deltaY))
      setEditorHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
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
        <button
          type="button"
          onClick={() => insertMarkdown('\n\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n', '')}
          disabled={disabled}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Table"
        >
          ⊞
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
      <div className="relative">
        {showPreview ? (
          <div
            className={`border border-gray-600 border-t-0 rounded-b-md bg-gray-700 p-3 overflow-y-auto ${error ? 'border-red-500' : ''}`}
            style={{ height: `${editorHeight}px` }}
          >
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
              height: `${editorHeight}px`,
              borderTop: 'none',
              borderRadius: '0 0 0.375rem 0.375rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }}
          />
        )}

        {/* Resize Handle */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-gray-600 hover:bg-gray-500 transition-colors flex items-center justify-center ${
            isResizing ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        >
          <div className="w-8 h-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>
    </div>
  )
}
