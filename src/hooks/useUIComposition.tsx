// UI Composition hook utilities
// Keep this for future overlay experiments - it attempts to find Steam's UI composition API

// Alternative search approaches for UI composition hook
const findUICompositionHook = (): any => {
  console.log('findUICompositionHook: Starting comprehensive search...');
  
  // Method 1: Direct webpack search (original approach) - Enhanced
  try {
    const webpackChunk = (window as any).webpackChunksteamui;
    if (webpackChunk) {
      // Try different cache access methods
      let moduleCache;
      
      // Approach 1a: Standard cache access
      try {
        moduleCache = webpackChunk.push([[Math.random()], {}, (r: any) => r.cache]);
      } catch (e) {
        console.log('Standard cache access failed, trying alternative...');
      }
      
      // Approach 1b: Direct cache access
      if (!moduleCache && webpackChunk.cache) {
        moduleCache = webpackChunk.cache;
      }
      
      // Approach 1c: Try to find cache in webpackChunk structure
      if (!moduleCache) {
        for (const key in webpackChunk) {
          if (key.includes('cache') || (webpackChunk[key] && typeof webpackChunk[key] === 'object' && Object.keys(webpackChunk[key]).length > 100)) {
            moduleCache = webpackChunk[key];
            console.log('Found potential cache via key:', key);
            break;
          }
        }
      }
      
      if (moduleCache) {
        console.log('Method 1: Searching webpack modules... Found cache with', Object.keys(moduleCache).length, 'modules');
        let searchCount = 0;
        const patterns = [
          /AddMinimumCompositionStateRequest/,
          /Composition.*State.*Request/,
          /MinimumComposition/,
          /CompositionState/
        ];
        
        for (const id in moduleCache) {
          searchCount++;
          try {
            const module = moduleCache[id];
            if (module?.exports && typeof module.exports === "object") {
              for (let prop in module.exports) {
                if (typeof module.exports[prop] === "function") {
                  const funcStr = module.exports[prop].toString();
                  
                  // Enhanced pattern matching
                  const matchedPatterns = patterns.filter(pattern => pattern.test(funcStr));
                  
                  if (matchedPatterns.length > 0) {
                    console.log(`Found potential UI composition function: ${prop} (matched ${matchedPatterns.length} patterns)`);
                    console.log('Function preview:', funcStr.substring(0, 400));
                    
                    // Check if it has the required methods
                    const hasAdd = funcStr.includes("AddMinimumCompositionStateRequest");
                    const hasChange = funcStr.includes("ChangeMinimumCompositionStateRequest") || funcStr.includes("ChangeMinimum");
                    const hasRemove = funcStr.includes("RemoveMinimumCompositionStateRequest") || funcStr.includes("RemoveMinimum");
                    const hasExcluded = funcStr.includes("m_mapCompositionStateRequests");
                    
                    console.log('Method compatibility check:', { hasAdd, hasChange, hasRemove, hasExcluded });
                    
                    if (hasAdd && hasChange && hasRemove && !hasExcluded) {
                      console.log('✅ Found perfect match with all required methods!');
                      return module.exports[prop];
                    } else if (hasAdd && (hasChange || hasRemove)) {
                      console.log('⚠️  Found good partial match, should work...');
                      return module.exports[prop];
                    } else if (hasAdd) {
                      console.log('⚠️  Found basic match, might work...');
                      return module.exports[prop];
                    }
                  }
                }
              }
            }
          } catch (e) {
            // ignore individual module errors
          }
          
          if (searchCount > 5000) break; // Increased search limit
        }
        console.log(`Method 1: Searched ${searchCount} modules, no perfect match found`);
      } else {
        console.log('Method 1: Could not access webpack module cache');
      }
    } else {
      console.log('Method 1: webpackChunksteamui not available');
    }
  } catch (e) {
    console.error('Method 1 failed:', e);
  }
  
  // Method 2: Try to find it via Steam's global objects - Enhanced
  try {
    console.log('Method 2: Searching Steam globals...');
    const steamGlobals = [
      'SteamClient', 
      'steamUI', 
      'g_PopupManager', 
      'g_MainWindowBrowser',
      'SteamUIStore',
      'GamepadUIMainWindowInstance',
      'g_Application'
    ];
    
    for (const globalName of steamGlobals) {
      const global = (window as any)[globalName];
      if (global && typeof global === 'object') {
        console.log(`Method 2: Checking ${globalName}... (keys: ${Object.keys(global).slice(0, 10).join(', ')})`);
        
        // Deep search in the global object
        const searchInObject = (obj: any, path: string = '', depth = 0): any => {
          if (depth > 4) return null; // Increased depth limit
          
          for (const key in obj) {
            try {
              const value = obj[key];
              const currentPath = path ? `${path}.${key}` : key;
              
              if (typeof value === 'function') {
                const funcStr = value.toString();
                if (funcStr.includes('AddMinimumCompositionStateRequest') || 
                    (funcStr.includes('MinimumComposition') && funcStr.includes('Request'))) {
                  console.log(`Method 2: Found in ${globalName}.${currentPath}`);
                  console.log('Function preview:', funcStr.substring(0, 300));
                  return value;
                }
              } else if (typeof value === 'object' && value !== null && 
                        !currentPath.includes('prototype') && 
                        !currentPath.includes('constructor')) {
                const result = searchInObject(value, currentPath, depth + 1);
                if (result) return result;
              }
            } catch (e) {
              // ignore access errors
            }
          }
          return null;
        };
        
        const result = searchInObject(global);
        if (result) return result;
      }
    }
  } catch (e) {
    console.error('Method 2 failed:', e);
  }
  
  // Method 3: Try a different webpack access pattern - Enhanced
  try {
    console.log('Method 3: Alternative webpack access...');
    const altWebpack = (window as any).__webpack_require__;
    if (altWebpack) {
      // Try multiple cache access patterns
      const cacheLocations = [
        altWebpack.cache,
        altWebpack.modules,
        (window as any).__webpack_modules__,
        (window as any).webpackChunksteamui?.[1]
      ];
      
      for (const cache of cacheLocations) {
        if (cache && typeof cache === 'object') {
          console.log('Method 3: Found cache with', Object.keys(cache).length, 'entries');
          for (const moduleId in cache) {
            try {
              const module = cache[moduleId];
              if (module?.exports) {
                const exports = module.exports;
                for (const prop in exports) {
                  if (typeof exports[prop] === 'function') {
                    const funcStr = exports[prop].toString();
                    if (funcStr.includes('AddMinimumCompositionStateRequest')) {
                      console.log('Method 3: Found via alternative webpack access');
                      return exports[prop];
                    }
                  }
                }
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Method 3 failed:', e);
  }
  
  // Method 4: Search all global functions
  try {
    console.log('Method 4: Searching all window properties...');
    const searchGlobalFunctions = (obj: any, visited = new Set()): any => {
      if (visited.has(obj) || visited.size > 1000) return null;
      visited.add(obj);
      
      for (const key in obj) {
        try {
          const value = obj[key];
          if (typeof value === 'function') {
            const funcStr = value.toString();
            if (funcStr.includes('AddMinimumCompositionStateRequest')) {
              console.log(`Method 4: Found in window.${key}`);
              return value;
            }
          } else if (typeof value === 'object' && value !== null && key !== 'document' && key !== 'window') {
            const result = searchGlobalFunctions(value, visited);
            if (result) return result;
          }
        } catch (e) {
          // ignore
        }
      }
      return null;
    };
    
    const result = searchGlobalFunctions(window);
    if (result) return result;
  } catch (e) {
    console.error('Method 4 failed:', e);
  }
  
  console.log('❌ All enhanced methods failed to find UI composition hook');
  return null;
};

// UI Composition types from Steam's internal API
export enum UIComposition {
  Hidden = 0,
  Notification = 1,
  Overlay = 2,
  Opaque = 3,
  OverlayKeyboard = 4,
}

// Type for the hook's return value
type UseUIComposition = (composition: UIComposition) => {
  releaseComposition: () => void;
};

// Extract the useUIComposition hook from Steam's modules
const foundUIComposition = findUICompositionHook();

export const useUIComposition: UseUIComposition = foundUIComposition || 
  (() => {
    console.warn('useUIComposition: Using fallback - UI composition hook not found');
    return { releaseComposition: () => {} };
  });