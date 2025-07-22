import { marked } from "marked";
import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  truncate?: boolean;
  maxLines?: number;
}

export function MarkdownRenderer({
  content,
  className = "",
  truncate = false,
  maxLines = 3,
}: MarkdownRendererProps) {
  const htmlContent = useMemo(() => {
    if (!content) return "";

    // Configure marked for safe rendering
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    try {
      return marked(content);
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return content; // Fallback to plain text
    }
  }, [content]);

  const truncateClass = truncate ? `line-clamp-${maxLines}` : "";

  return (
    <div
      className={`markdown-content ${className} ${truncateClass}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={
        {
          // Custom styles for markdown content in dark theme
          "--markdown-color": "rgb(209, 213, 219)",
          "--markdown-heading-color": "white",
          "--markdown-strong-color": "white",
          "--markdown-code-bg": "rgb(31, 41, 55)",
          "--markdown-code-color": "rgb(96, 165, 250)",
        } as React.CSSProperties
      }
    />
  );
}

// Add global styles for markdown content
const markdownStyles = `
  .markdown-content {
    color: var(--markdown-color);
  }
  
  .markdown-content h1,
  .markdown-content h2,
  .markdown-content h3,
  .markdown-content h4,
  .markdown-content h5,
  .markdown-content h6 {
    color: var(--markdown-heading-color);
    font-weight: 600;
    margin-top: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .markdown-content h1 { font-size: 1.25rem; }
  .markdown-content h2 { font-size: 1.125rem; }
  .markdown-content h3 { font-size: 1rem; }
  .markdown-content h4 { font-size: 0.875rem; }
  .markdown-content h5 { font-size: 0.875rem; }
  .markdown-content h6 { font-size: 0.875rem; }
  
  .markdown-content p {
    margin-bottom: 0.5rem;
  }
  
  .markdown-content strong {
    color: var(--markdown-heading-color);
    font-weight: 600;
  }
  
  .markdown-content em {
    font-style: italic;
  }
  
  .markdown-content code {
    background-color: var(--markdown-code-bg);
    color: var(--markdown-code-color);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  }
  
  .markdown-content pre {
    background-color: var(--markdown-code-bg);
    color: var(--markdown-color);
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    overflow-x: auto;
    font-size: 0.875rem;
  }
  
  .markdown-content pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
  }
  
  .markdown-content ul,
  .markdown-content ol {
    margin-left: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .markdown-content li {
    margin-bottom: 0.125rem;
  }
  
  .markdown-content blockquote {
    border-left: 4px solid rgb(59, 130, 246);
    background-color: rgb(31, 41, 55);
    padding: 0.5rem 0.75rem;
    margin: 0.5rem 0;
    border-radius: 0 0.375rem 0.375rem 0;
  }
  
  .markdown-content a {
    color: rgb(96, 165, 250);
    text-decoration: underline;
  }
  
  .markdown-content a:hover {
    color: rgb(147, 197, 253);
  }
  
  /* Line clamp utilities */
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles into the document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = markdownStyles;
  document.head.appendChild(styleElement);
}
