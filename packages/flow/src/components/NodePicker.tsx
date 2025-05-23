import React, { useState, useMemo } from "react";
import { NodePickerProps } from "../types";

export function NodePicker({
  isOpen,
  position,
  onClose,
  onSelectNode,
  registry,
}: NodePickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const nodeTypes = useMemo(() => {
    const types = Object.keys(registry.nodes);
    if (!searchTerm) return types;
    return types.filter((type) =>
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [registry.nodes, searchTerm]);

  const categories = useMemo(() => {
    const cats: Record<string, string[]> = {};
    nodeTypes.forEach((type) => {
      const category = type.split("/")[0] || "other";
      if (!cats[category]) cats[category] = [];
      cats[category].push(type);
    });
    return cats;
  }, [nodeTypes]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg w-64 max-h-96 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Add Node</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {/* Node list */}
      <div className="max-h-64 overflow-y-auto">
        {Object.entries(categories).map(([category, types]) => (
          <div key={category}>
            <div className="px-3 py-1 bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wide">
              {category}
            </div>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => {
                  onSelectNode(type, position);
                  onClose();
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:outline-none focus:bg-blue-50"
              >
                <div className="font-medium text-gray-900">
                  {type.split("/").pop()}
                </div>
                <div className="text-xs text-gray-500">{type}</div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
