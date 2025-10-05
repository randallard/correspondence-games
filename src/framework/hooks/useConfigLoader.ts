/**
 * @fileoverview React hook for loading and validating game configurations
 * @module framework/hooks/useConfigLoader
 *
 * Provides a React hook to load game configs from YAML files.
 *
 * Features:
 * - Async loading with proper loading states
 * - Error handling and reporting
 * - Type-safe validated configs
 * - Can be extended for dynamic config switching
 *
 * @example
 * ```tsx
 * function GameApp() {
 *   const { config, loading, error } = useConfigLoader(gameConfigYaml);
 *
 *   if (loading) return <div>Loading game...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!config) return <div>No config loaded</div>;
 *
 *   return <GameBoard config={config} />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import type { GameConfig } from '../core/config/types';
import { loadGameConfig, ConfigValidationError, ConfigLoadError } from '../core/config/loader';

/**
 * Result of useConfigLoader hook
 */
export interface ConfigLoaderResult {
  /** Loaded and validated game configuration */
  config: GameConfig | null;

  /** Whether config is currently loading */
  loading: boolean;

  /** Error if loading/validation failed */
  error: Error | null;

  /** Reload the configuration */
  reload: () => void;
}

/**
 * Hook to load and validate game configuration
 *
 * Handles async loading, validation, and error states.
 *
 * @param yamlData - Parsed YAML data (from `import config from './game.yaml'`)
 * @param configPath - Optional path for error reporting
 * @returns Config loader result with loading states
 *
 * @example
 * ```tsx
 * import prisonersDilemmaYaml from '/games/configs/prisoners-dilemma.yaml';
 *
 * function App() {
 *   const { config, loading, error } = useConfigLoader(prisonersDilemmaYaml);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorDisplay error={error} />;
 *
 *   return <Game config={config!} />;
 * }
 * ```
 */
export function useConfigLoader(
  yamlData: unknown,
  configPath?: string
): ConfigLoaderResult {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    // Reset states
    setLoading(true);
    setError(null);

    // Load and validate config
    try {
      const validatedConfig = loadGameConfig(yamlData, configPath);
      setConfig(validatedConfig);
      setLoading(false);
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        setError(
          new Error(
            `Config validation failed:\n${err.errors.join('\n')}`
          )
        );
      } else if (err instanceof ConfigLoadError) {
        setError(err);
      } else {
        setError(new Error(`Failed to load config: ${String(err)}`));
      }
      setConfig(null);
      setLoading(false);
    }
  }, [yamlData, configPath, reloadTrigger]);

  const reload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  return { config, loading, error, reload };
}

/**
 * Hook variant that loads config by game ID
 *
 * Useful for dynamic game selection from a list of configs.
 *
 * @param gameId - Game identifier (e.g., 'prisoners-dilemma')
 * @returns Config loader result
 *
 * @example
 * ```tsx
 * function GameSelector() {
 *   const [selectedGame, setSelectedGame] = useState('prisoners-dilemma');
 *   const { config, loading, error } = useConfigByGameId(selectedGame);
 *
 *   return (
 *     <>
 *       <select onChange={(e) => setSelectedGame(e.target.value)}>
 *         <option value="prisoners-dilemma">Prisoner's Dilemma</option>
 *         <option value="rock-paper-scissors">Rock Paper Scissors</option>
 *       </select>
 *       {config && <Game config={config} />}
 *     </>
 *   );
 * }
 * ```
 */
export function useConfigByGameId(gameId: string): ConfigLoaderResult {
  const [yamlData, setYamlData] = useState<unknown>(null);
  const [importError, setImportError] = useState<Error | null>(null);

  useEffect(() => {
    // Dynamically import the YAML config
    const loadYaml = async () => {
      try {
        // Note: This requires Vite's dynamic import support
        const module = await import(
          `/games/configs/${gameId}.yaml`
        );
        setYamlData(module.default);
        setImportError(null);
      } catch (err) {
        setImportError(
          new Error(`Failed to load config for game "${gameId}": ${String(err)}`)
        );
        setYamlData(null);
      }
    };

    loadYaml();
  }, [gameId]);

  const result = useConfigLoader(yamlData, `${gameId}.yaml`);

  // Merge import errors with validation errors
  if (importError && !result.error) {
    return { ...result, error: importError };
  }

  return result;
}

/**
 * Hook for managing multiple game configs
 *
 * Useful for game selection UI.
 *
 * @param gameIds - Array of game IDs to load
 * @returns Map of game IDs to config loader results
 */
export function useMultipleConfigs(
  gameIds: string[]
): Map<string, ConfigLoaderResult> {
  const [configs] = useState(() => new Map<string, ConfigLoaderResult>());

  // Note: This is a simplified version
  // In production, you'd want to actually implement the loading logic
  // for multiple configs and track their individual states

  return configs;
}
