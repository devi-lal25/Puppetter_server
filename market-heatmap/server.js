import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

// Stock sectors mapping
const SECTOR_MAP = {
  'Technology': ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AVGO', 'ORCL', 'CRM', 'ADBE', 'AMD', 'CSCO', 'INTC', 'QCOM', 'TXN', 'NOW'],
  'Healthcare': ['LLY', 'UNH', 'JNJ', 'MRK', 'ABBV', 'TMO', 'ABT', 'PFE', 'AMGN', 'DHR', 'BMY', 'GILD', 'ISRG', 'VRTX', 'REGN'],
  'Financials': ['BRK.B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'SPGI', 'BLK', 'AXP', 'C', 'PGR', 'SCHW'],
  'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'SBUX', 'TGT', 'BKNG', 'CMG', 'ORLY', 'ROST'],
  'Consumer Defensive': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'PM', 'MO', 'CL', 'MDLZ', 'KMB', 'GIS', 'HSY'],
  'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY'],
  'Industrials': ['GE', 'CAT', 'HON', 'UNP', 'BA', 'RTX', 'DE', 'UPS', 'LMT', 'ADP', 'ETN', 'GD'],
  'Communication': ['NFLX', 'DIS', 'CMCSA', 'TMUS', 'VZ', 'T', 'CHTR', 'EA'],
  'Real Estate': ['PLD', 'AMT', 'EQIX', 'CCI', 'PSA', 'SPG', 'O', 'WELL'],
  'Utilities': ['NEE', 'SO', 'DUK', 'SRE', 'AEP', 'D', 'EXC'],
  'Materials': ['LIN', 'APD', 'SHW', 'ECL', 'FCX', 'NEM', 'DOW', 'DD']
};

// Flatten all tickers
const ALL_TICKERS = Object.values(SECTOR_MAP).flat();

// Market data state
let marketData = {};
let websocketClients = new Set();

// Initialize with base data
async function initializeMarketData() {
  console.log('Initializing market data...');
  
  // If we have a Finnhub API key, use it
  if (FINNHUB_API_KEY) {
    try {
      for (const ticker of ALL_TICKERS) {
        try {
          const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
          const quote = await quoteRes.json();
          
          if (quote && quote.c) {
            const prevClose = quote.pc || quote.c;
            const change = ((quote.c - prevClose) / prevClose) * 100;
            
            marketData[ticker] = {
              price: quote.c,
              change: parseFloat(change.toFixed(2)),
              volume: quote.v || 0,
              high: quote.h,
              low: quote.l,
              open: quote.o,
              previousClose: prevClose
            };
          }
        } catch (e) {
          console.error(`Error fetching ${ticker}:`, e.message);
        }
      }
    } catch (e) {
      console.error('Error initializing from Finnhub:', e.message);
    }
  }
  
  // Fallback: generate realistic simulated data
  if (Object.keys(marketData).length === 0) {
    console.log('Using simulated market data (set FINNHUB_API_KEY for live data)');
    generateSimulatedData();
  }
  
  broadcastData();
}

function generateSimulatedData() {
  const basePrices = {
    'AAPL': 175, 'MSFT': 420, 'NVDA': 875, 'GOOGL': 165, 'META': 485,
    'AMZN': 178, 'TSLA': 175, 'JPM': 195, 'V': 275, 'JNJ': 155,
    'WMT': 59, 'PG': 160, 'XOM': 115, 'BAC': 37, 'MA': 455
  };
  
  for (const ticker of ALL_TICKERS) {
    const basePrice = basePrices[ticker] || (50 + Math.random() * 400);
    const changePercent = (Math.random() - 0.48) * 6; // Slight bullish bias
    const price = basePrice * (1 + changePercent / 100);
    const volume = Math.floor(Math.random() * 50000000) + 1000000;
    
    marketData[ticker] = {
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(changePercent.toFixed(2)),
      volume: volume,
      high: parseFloat((price * 1.02).toFixed(2)),
      low: parseFloat((price * 0.98).toFixed(2)),
      open: parseFloat((price * (1 - changePercent/100)).toFixed(2)),
      previousClose: parseFloat(price.toFixed(2))
    };
  }
}

// Simulate live updates every 3 seconds
function simulateLiveUpdates() {
  setInterval(() => {
    if (FINNHUB_API_KEY) return; // Don't simulate if using real API
    
    for (const ticker of ALL_TICKERS) {
      if (marketData[ticker]) {
        const volatility = 0.3;
        const change = (Math.random() - 0.5) * volatility;
        const newChange = marketData[ticker].change + change;
        const newPrice = marketData[ticker].previousClose * (1 + newChange / 100);
        
        marketData[ticker] = {
          ...marketData[ticker],
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(newChange.toFixed(2)),
          volume: marketData[ticker].volume + Math.floor(Math.random() * 100000)
        };
      }
    }
    
    broadcastData();
  }, 3000);
}

function broadcastData() {
  const data = {
    timestamp: Date.now(),
    stocks: marketData,
    sectors: calculateSectorPerformance()
  };
  
  const message = JSON.stringify(data);
  websocketClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function calculateSectorPerformance() {
  const sectors = {};
  
  for (const [sector, tickers] of Object.entries(SECTOR_MAP)) {
    const sectorStocks = tickers.filter(t => marketData[t]);
    if (sectorStocks.length > 0) {
      const avgChange = sectorStocks.reduce((sum, t) => sum + marketData[t].change, 0) / sectorStocks.length;
      const totalCap = sectorStocks.reduce((sum, t) => {
        const price = marketData[t]?.price || 0;
        const volume = marketData[t]?.volume || 0;
        return sum + (price * volume);
      }, 0);
      
      sectors[sector] = {
        change: parseFloat(avgChange.toFixed(2)),
        stockCount: sectorStocks.length,
        totalVolume: totalCap
      };
    }
  }
  
  return sectors;
}

// REST API endpoint
app.get('/api/market-data', (req, res) => {
  res.json({
    timestamp: Date.now(),
    stocks: marketData,
    sectors: calculateSectorPerformance()
  });
});

app.get('/api/sectors', (req, res) => {
  res.json(SECTOR_MAP);
});

// WebSocket server
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  websocketClients.add(ws);
  
  // Send initial data
  ws.send(JSON.stringify({
    timestamp: Date.now(),
    stocks: marketData,
    sectors: calculateSectorPerformance()
  }));
  
  ws.on('close', () => {
    console.log('Client disconnected');
    websocketClients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    websocketClients.delete(ws);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  initializeMarketData();
  simulateLiveUpdates();
});
