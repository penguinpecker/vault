// VAULT - API Configuration
// All API keys for price data

export const API_CONFIG = {
  finnhub: {
    key: 'd5slq1pr01qmiccal8ngd5slq1pr01qmiccal8o0',
    baseUrl: 'https://finnhub.io/api/v1',
    rateLimit: 60, // calls per minute
  },
  coingecko: {
    key: 'CG-fs71VwpMmNfwUhmXmQo5khoW',
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: 30, // calls per minute
  },
  metals: {
    key: 'GQ6AOB3XCUUIRFXXWNK6515XXWNK6',
    baseUrl: 'https://api.metals.dev/v1',
    rateLimit: 100, // calls per month
  },
};

// Asset type detection
export const ASSET_TYPES = {
  STOCK: 'stock',
  ETF: 'etf',
  CRYPTO: 'crypto',
  COMMODITY: 'commodity',
} as const;

// Commodity symbols mapping
export const COMMODITY_SYMBOLS: Record<string, string> = {
  // Precious Metals
  'XAU': 'gold',
  'GOLD': 'gold',
  'XAG': 'silver',
  'SILVER': 'silver',
  'XPT': 'platinum',
  'PLATINUM': 'platinum',
  'XPD': 'palladium',
  'PALLADIUM': 'palladium',
};

// Popular crypto symbols (CoinGecko IDs)
export const CRYPTO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'USDC': 'usd-coin',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'TRX': 'tron',
  'TON': 'the-open-network',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'XLM': 'stellar',
  'ATOM': 'cosmos',
  'UNI': 'uniswap',
  'XMR': 'monero',
  'ETC': 'ethereum-classic',
  'FIL': 'filecoin',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'NEAR': 'near',
  'VET': 'vechain',
  'ALGO': 'algorand',
  'FTM': 'fantom',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'AAVE': 'aave',
  'MKR': 'maker',
  'CRV': 'curve-dao-token',
  'LDO': 'lido-dao',
  'RNDR': 'render-token',
  'INJ': 'injective-protocol',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'PEPE': 'pepe',
  'WIF': 'dogwifcoin',
  'BONK': 'bonk',
};
