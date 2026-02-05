/**
 * Deferred Translation Module
 * Barrel exports for deferred/skeleton translation functionality
 */

export { isInFlight, setInFlight, deleteInFlight, buildInFlightKey } from './in-flight-store.js'
export { startBackgroundSegmentTranslation } from './background-segment-translator.js'
export { startBackgroundPathTranslation } from './background-path-translator.js'
export { injectDeferredAssets, getDeferredScript } from './injector.js'
export { handlePollingRequest } from './polling-handler.js'
