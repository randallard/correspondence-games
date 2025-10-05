/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

/**
 * Type declarations for YAML imports via Vite plugin
 */
declare module '*.yaml' {
  const content: Record<string, unknown>;
  export default content;
}

declare module '*.yml' {
  const content: Record<string, unknown>;
  export default content;
}
