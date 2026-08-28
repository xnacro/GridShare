import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Dynamic JWT Bearer token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('gridshare_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  // System Health
  getHealth: () => apiClient.get('/health'),

  // Authentication
  login: (credentials) => apiClient.post('/auth/login', credentials),

  // Authenticated User Identity & Multi-Tenant Scoping
  getMe: (tokenOverride) => {
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : {};
    return apiClient.get('/me', { headers });
  },
  getMyHousehold: () => apiClient.get('/my-household'),
  getMyEnergy: () => apiClient.get('/my-energy'),
  updateMyEnergySource: (data) => apiClient.post('/my-energy/source', data),
  getMyTransactions: (limit = 50) => apiClient.get('/my-transactions', { params: { limit } }),
  getMyDevices: () => apiClient.get('/my-devices'),

  // Dashboard & Summaries
  getDashboardSummary: () => apiClient.get('/dashboard/summary'),

  // Telemetry & Observe
  getCommunityState: () => apiClient.get('/observe/state'),
  getHouseholds: () => apiClient.get('/households'),
  getHousehold: (id) => apiClient.get(`/households/${id}`),
  getEnergySummary: () => apiClient.get('/energy/summary'),
  getLiveEnergy: () => apiClient.get('/energy/summary'),
  getEnergyHistory: (params) => apiClient.get('/energy/history', { params }),
  getCommunityMetrics: () => apiClient.get('/community/metrics'),

  // Devices & Hardware Telemetry
  getDevices: () => apiClient.get('/devices'),
  getDeviceMode: () => apiClient.get('/devices/mode'),
  setDeviceMode: (mode) => apiClient.post('/devices/mode', { mode }),

  // Community Battery & Ownership Accounting
  getBattery: () => apiClient.get('/battery'),
  getBatteryOwnership: () => apiClient.get('/battery/ownership'),
  contributeBattery: (data) => apiClient.post('/battery/contribute', data),
  withdrawBattery: (data) => apiClient.post('/battery/withdraw', data),
  getBatteryLedger: (limit = 100) => apiClient.get('/battery/ledger', { params: { limit } }),
  evaluateStorageDecision: (data) => apiClient.post('/optimization/storage-decision', data),
  runBatteryFairnessDemo: () => apiClient.post('/demo/battery-fairness-demo'),

  // AI Prediction, Optimizer & Copilot
  getCopilotInsights: (params) => apiClient.get('/copilot/insights', { params }),
  simulateCopilotShock: (data) => apiClient.post('/copilot/simulate-shock', data),
  simulateScenario: (data) => apiClient.post('/copilot/scenario', data),
  queryCopilot: (data) => apiClient.post('/copilot/query', data),
  getModelHealth: () => apiClient.get('/copilot/model-health'),
  getPredictions: (params) => apiClient.get('/predictions', { params }),
  getLatestPredictions: (params) => apiClient.get('/predictions', { params }),
  runPredictionPipeline: () => apiClient.post('/predictions/run'),
  getOptimizations: (limit = 50) => apiClient.get('/optimizations', { params: { limit } }),
  getLatestOptimization: (limit = 10) => apiClient.get('/optimization/latest', { params: { limit } }),
  runOptimization: (data = {}) => apiClient.post('/optimize', data),

  // P2P Double-Auction Marketplace
  getMarketOffers: (params) => apiClient.get('/market/offers', { params }),
  createOffer: (data) => apiClient.post('/market/offers', data),
  cancelOffer: (id) => apiClient.delete(`/market/offers/${id}`),
  getMarketRequests: (params) => apiClient.get('/market/requests', { params }),
  createRequest: (data) => apiClient.post('/market/requests', data),
  cancelRequest: (id) => apiClient.delete(`/market/requests/${id}`),
  matchOrders: () => apiClient.post('/market/match'),
  getMarketTransactions: (limit = 50) => apiClient.get('/market/transactions', { params: { limit } }),
  getTrades: (limit = 50) => apiClient.get('/trades', { params: { limit } }),
  postTelemetry: (data) => apiClient.post('/telemetry', data),

  // Demo Mode Endpoints
  runDemoScenario: () => apiClient.post('/demo/run-scenario'),
  runPptScenario: () => apiClient.post('/demo/ppt-scenario'),
  resetDemo: () => apiClient.post('/demo/reset'),
};

export default api;
