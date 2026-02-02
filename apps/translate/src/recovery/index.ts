/**
 * Recovery Module - Barrel Exports
 *
 * Provides client-side translation recovery for SPA frameworks (Next.js, Nuxt, etc.)
 * that revert server-rendered translations during hydration.
 */

export { detectSpaFramework } from './framework-detector.js'
export { buildTranslationDictionary, type TranslationDictionary } from './dictionary-builder.js'
export { injectRecoveryAssets, markSkippedElements, getRecoveryScript } from './injector.js'
export { RECOVERY_SCRIPT } from './recovery-script-content.js'
