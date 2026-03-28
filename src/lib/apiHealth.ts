// Centralized API Health Monitor & Circuit Breaker

export interface ApiHealthEntry {
  timestamp: number;
  source: 'laravel' | 'edge';
  endpoint: string;
  status: 'success' | 'error';
  responseTime: number;
  error?: string;
}

export interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  openedAt: number;
}

const MAX_LOG = 100;
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 30_000; // 30s half-open window

let healthLog: ApiHealthEntry[] = [];
let circuitState: CircuitState = { failures: 0, lastFailure: 0, isOpen: false, openedAt: 0 };
const listeners = new Set<() => void>();

export const apiHealth = {
  log(entry: ApiHealthEntry) {
    healthLog = [entry, ...healthLog].slice(0, MAX_LOG);
    if (entry.source === 'laravel' && entry.status === 'error') {
      circuitState.failures++;
      circuitState.lastFailure = Date.now();
      if (circuitState.failures >= CIRCUIT_THRESHOLD) {
        circuitState.isOpen = true;
        circuitState.openedAt = Date.now();
      }
    } else if (entry.source === 'laravel' && entry.status === 'success') {
      circuitState = { failures: 0, lastFailure: 0, isOpen: false, openedAt: 0 };
    }
    listeners.forEach(fn => fn());
  },

  getLog: () => healthLog,

  getCircuit(): CircuitState {
    // Half-open: allow retry after reset window
    if (circuitState.isOpen && Date.now() - circuitState.openedAt > CIRCUIT_RESET_MS) {
      return { ...circuitState, isOpen: false };
    }
    return { ...circuitState };
  },

  isCircuitOpen(): boolean {
    return this.getCircuit().isOpen;
  },

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  getStats() {
    const now = Date.now();
    const recent = healthLog.filter(e => now - e.timestamp < 5 * 60_000);
    const laravelOk = recent.filter(e => e.source === 'laravel' && e.status === 'success').length;
    const laravelFail = recent.filter(e => e.source === 'laravel' && e.status === 'error').length;
    const edgeOk = recent.filter(e => e.source === 'edge' && e.status === 'success').length;
    const edgeFail = recent.filter(e => e.source === 'edge' && e.status === 'error').length;
    const laravelAvgMs = recent.filter(e => e.source === 'laravel' && e.status === 'success')
      .reduce((sum, e, _, arr) => sum + e.responseTime / arr.length, 0);
    const edgeAvgMs = recent.filter(e => e.source === 'edge' && e.status === 'success')
      .reduce((sum, e, _, arr) => sum + e.responseTime / arr.length, 0);
    const lastError = healthLog.find(e => e.status === 'error');

    return {
      laravelOk, laravelFail, edgeOk, edgeFail,
      laravelAvgMs: Math.round(laravelAvgMs),
      edgeAvgMs: Math.round(edgeAvgMs),
      lastError,
      circuit: this.getCircuit(),
      totalRequests: recent.length,
    };
  },

  clear() {
    healthLog = [];
    circuitState = { failures: 0, lastFailure: 0, isOpen: false, openedAt: 0 };
    listeners.forEach(fn => fn());
  },
};

// User-friendly error messages
export function friendlyErrorMessage(error: any): string {
  if (!error) return 'একটি অজানা সমস্যা হয়েছে';
  
  const msg = error?.message || error?.error || String(error);
  
  if (/network\s*error/i.test(msg) || error?.code === 'ERR_NETWORK') {
    return 'সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
  }
  if (/timeout/i.test(msg)) {
    return 'সার্ভার সময়মতো সাড়া দিচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
  if (error?.status === 401 || error?.response?.status === 401) {
    return 'আপনার সেশন শেষ হয়ে গেছে। আবার লগইন করুন।';
  }
  if (error?.status === 403 || error?.response?.status === 403) {
    return 'এই কাজের জন্য আপনার অনুমতি নেই।';
  }
  if (error?.status === 404 || error?.response?.status === 404) {
    return 'রিকোয়েস্ট করা তথ্য পাওয়া যায়নি।';
  }
  if (error?.status === 429 || error?.response?.status === 429) {
    return 'অনেক বেশি রিকোয়েস্ট হয়েছে। কিছুক্ষণ অপেক্ষা করুন।';
  }
  if (error?.status >= 500 || error?.response?.status >= 500) {
    return 'সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
  
  return msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
}
