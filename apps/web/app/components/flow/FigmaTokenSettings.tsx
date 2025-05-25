import React, { useState, useEffect } from "react";

interface FigmaTokenSettingsProps {
  onTokenSaved?: (token: string) => void;
}

export function FigmaTokenSettings({ onTokenSaved }: FigmaTokenSettingsProps) {
  const [token, setToken] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    // Check if token is already configured
    const existingToken = localStorage.getItem("figma_token");
    if (existingToken) {
      setToken(existingToken);
      setIsConfigured(true);
    }
  }, []);

  const handleSave = () => {
    if (token.trim()) {
      localStorage.setItem("figma_token", token.trim());
      setIsConfigured(true);
      onTokenSaved?.(token.trim());
    }
  };

  const handleClear = () => {
    localStorage.removeItem("figma_token");
    setToken("");
    setIsConfigured(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Figma Integration</h3>
        <div
          className={`px-2 py-1 rounded text-xs ${
            isConfigured
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {isConfigured ? "Configured" : "Not Configured"}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Figma Personal Access Token
          </label>
          <div className="flex gap-2">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your Figma token..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              {showToken ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!token.trim()}
            className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Token
          </button>
          {isConfigured && (
            <button
              onClick={handleClear}
              className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>
            Get your token from:{" "}
            <a
              href="https://www.figma.com/developers/api#access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Figma Developer Settings
            </a>
          </p>
          <p className="mt-1">Token is stored locally in your browser.</p>
        </div>
      </div>
    </div>
  );
}
