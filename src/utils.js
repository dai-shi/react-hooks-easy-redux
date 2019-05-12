import { useEffect, useLayoutEffect, useReducer } from 'react';

export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// useForceUpdate hook
const forcedReducer = state => state + 1;
export const useForceUpdate = () => useReducer(forcedReducer, 0)[1];

// -------------------------------------------------------
// deep proxy
// -------------------------------------------------------

const OWN_KEYS_SYMBOL = Symbol('OWN_KEYS');

const createProxyHandler = () => ({
  recordUsage(target, key) {
    let used = this.affected.get(target);
    if (!used) {
      used = new Set();
      this.affected.set(target, used);
    }
    used.add(key);
  },
  get(target, key) {
    this.recordUsage(target, key);
    const val = target[key];
    if (typeof val !== 'object') {
      return val;
    }
    const proto = Object.getPrototypeOf(val);
    if (proto !== Object.prototype && proto !== Array.prototype) {
      return val;
    }
    if (Object.isFrozen(target)) {
      return val;
    }
    // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
    return createDeepProxy(val, this.affected, this.proxyCache);
  },
  has(target, key) {
    // LIMITATION:
    // We simply record the same as get.
    // This means { a: {} } and { a: {} } is detected as changed,
    // if 'a' in obj is handled.
    this.recordUsage(target, key);
    return key in target;
  },
  ownKeys(target) {
    this.recordUsage(target, OWN_KEYS_SYMBOL);
    return Reflect.ownKeys(target);
  },
});

export const createDeepProxy = (obj, affected, proxyCache) => {
  let proxyHandler = proxyCache && proxyCache.get(obj);
  if (!proxyHandler) {
    proxyHandler = createProxyHandler();
    proxyHandler.proxy = new Proxy(obj, proxyHandler);
    if (proxyCache) {
      proxyCache.set(obj, proxyHandler);
    }
  }
  proxyHandler.affected = affected;
  proxyHandler.proxyCache = proxyCache;
  return proxyHandler.proxy;
};

const isOwnKeysChanged = (origObj, nextObj) => {
  const origKeys = Reflect.ownKeys(origObj);
  const nextKeys = Reflect.ownKeys(nextObj);
  return origKeys.length !== nextKeys.length
    || origKeys.some((k, i) => k !== nextKeys[i]);
};

export const isDeepChanged = (
  origObj,
  nextObj,
  affected,
  cache,
  assumeChangedIfNotAffected,
) => {
  if (origObj === nextObj) return false;
  if (typeof origObj !== 'object') return true;
  if (typeof nextObj !== 'object') return true;
  const used = affected.get(origObj);
  if (!used) return !!assumeChangedIfNotAffected;
  if (cache) {
    const hit = cache.get(origObj);
    if (hit && hit.nextObj === nextObj) {
      return hit.changed;
    }
    // for object with cycles (changed is `undefined`)
    cache.set(origObj, { nextObj });
  }
  let changed = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const key of used) {
    const c = key === OWN_KEYS_SYMBOL ? isOwnKeysChanged(origObj, nextObj)
      : isDeepChanged(
        origObj[key],
        nextObj[key],
        affected,
        cache,
        assumeChangedIfNotAffected !== false,
      );
    if (typeof c === 'boolean') changed = c;
    if (changed) break;
  }
  if (changed === null) changed = !!assumeChangedIfNotAffected;
  if (cache) {
    cache.set(origObj, { nextObj, changed });
  }
  return changed;
};