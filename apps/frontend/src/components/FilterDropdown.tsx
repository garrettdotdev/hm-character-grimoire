import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SpellConvocation } from "@repo/types";

interface FilterDropdownProps {
  selectedConvocation: string;
  selectedComplexity: string;
  sortBy: "name" | "complexity";
  onConvocationChange: (value: string) => void;
  onComplexityChange: (value: string) => void;
  onSortChange: (value: "name" | "complexity") => void;
}

export function FilterDropdown({
  selectedConvocation,
  selectedComplexity,
  sortBy,
  onConvocationChange,
  onComplexityChange,
  onSortChange,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const convocations = Object.values(SpellConvocation);

  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap (mt-1)
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 256), // min-w-64 = 256px
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key and handle position updates
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleScroll() {
      if (isOpen) {
        updateDropdownPosition();
      }
    }

    function handleResize() {
      if (isOpen) {
        updateDropdownPosition();
      }
    }

    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      return () => {
        document.removeEventListener("keydown", handleEscape);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen]);

  // Generate summary text for the button
  const getFilterSummary = () => {
    const filters = [];
    
    if (selectedConvocation !== "all") {
      filters.push(selectedConvocation);
    }
    
    if (selectedComplexity !== "all") {
      filters.push(`Level ${selectedComplexity}`);
    }
    
    if (sortBy !== "name") {
      filters.push("By Complexity");
    }
    
    if (filters.length === 0) {
      return "Filters";
    }
    
    return filters.length === 1 ? filters[0] : `${filters.length} filters`;
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 flex items-center gap-2 min-w-24"
      >
        <span className="truncate">{getFilterSummary()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg z-[9999]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Convocation
              </label>
              <select
                value={selectedConvocation}
                onChange={(e) => onConvocationChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Convocations</option>
                {convocations.map((conv) => (
                  <option key={conv} value={conv}>
                    {conv}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Complexity
              </label>
              <select
                value={selectedComplexity}
                onChange={(e) => onComplexityChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Complexity</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <option key={level} value={level.toString()}>
                    Level {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as "name" | "complexity")}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="complexity">Sort by Complexity</option>
              </select>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
