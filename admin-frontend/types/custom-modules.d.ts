// Declarations for third-party modules that don't provide types or are imported from deep paths
declare module 'next/dist/lib/metadata/types/metadata-interface.js' {
  export type ResolvingMetadata = any
  export type ResolvingViewport = any
}

/* lucide-react removed from manual declarations so package-provided types (if present) are used */

declare module 'next/navigation' {
  export function useRouter(): any
}

declare module 'next/link' {
  import * as React from 'react'
  const Link: React.ComponentType<any>
  export default Link
}

declare module 'clsx' {
  export type ClassValue = any
  const clsx: (...args: any[]) => string
  export default clsx
  export { clsx }
}

declare module 'tailwind-merge' {
  export function twMerge(...classes: any[]): string
  export default twMerge
}

declare module 'framer-motion' {
  export const motion: any
  export const AnimatePresence: any
}

declare module 'next-themes' {
  export const ThemeProvider: any
  export type ThemeProviderProps = any
  export function useTheme(): any
  export default ThemeProvider
}
