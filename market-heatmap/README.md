# US Stock Market Heatmap - Live Data

A full-stack real-time stock market heatmap application built with React, Node.js, Express, and WebSockets.

## Features

- **Live Data Updates**: Real-time stock price updates via WebSocket (every 3 seconds)
- **Modern UI**: Beautiful gradient design with Tailwind CSS
- **Interactive Heatmap**: Squarified treemap visualization of stock performance
- **Sector Analysis**: View stocks grouped by sector or flat layout
- **Search Functionality**: Filter stocks by ticker symbol
- **Responsive Design**: Works on desktop and mobile devices
- **Tooltips**: Hover over any stock to see detailed information
- **Dual Data Mode**: 
  - Simulated data (default) for demonstration
  - Live Finnhub API data (set your API key)

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Custom squarified treemap algorithm
- WebSocket client for real-time updates

### Backend
- Node.js with Express
- WebSocket server (ws library)
- Finnhub API integration (optional)
- CORS enabled for cross-origin requests

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd market-heatmap
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up live data:
   - Get a free API key from [Finnhub](https://finnhub.io/)
   - Edit `.env` file and add your API key:
   ```
   FINNHUB_API_KEY=your_api_key_here
   ```

4. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend dev server (port 5173).

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Project Structure

```
market-heatmap/
├── server.js          # Backend server with WebSocket
├── src/
│   ├── App.jsx        # Main React component
│   ├── main.jsx       # React entry point
│   └── index.css      # Tailwind CSS imports
├── index.html         # HTML template
├── vite.config.js     # Vite configuration
├── tailwind.config.js # Tailwind configuration
├── postcss.config.js  # PostCSS configuration
├── package.json       # Dependencies and scripts
└── .env               # Environment variables
```

## Usage

### Controls

- **Time Period**: Switch between 1D, 1W, 1M, 3M, YTD, 1Y views
- **View By**: Toggle between Sector grouping and flat Market Cap view
- **Size By**: Choose between Market Cap and Volume for tile sizing
- **Search**: Filter stocks by ticker symbol

### Color Legend

- **Red tones**: Negative performance (-5% or worse = dark red)
- **Green tones**: Positive performance (+5% or better = dark green)
- **Neutral**: Around 0% change (white/light gray)

### Box Metrics

- **Box Size**: Represents Market Cap or Volume (selectable)
- **Box Color**: Represents percentage change
- **Hover**: Shows detailed stock information

## API Endpoints

### REST API

- `GET /api/market-data` - Get current market data snapshot
- `GET /api/sectors` - Get sector-to-stocks mapping

### WebSocket

- `WS /ws` - Connect for real-time updates
  - Receives JSON messages with stocks and sectors data every 3 seconds

## Customization

### Adding More Stocks

Edit the `SECTOR_MAP` object in both `server.js` and `src/App.jsx` to add more tickers to existing sectors or create new sectors.

### Changing Update Frequency

Modify the interval in `server.js`:
```javascript
setInterval(() => { ... }, 3000); // Change 3000 to desired milliseconds
```

### Styling

All styles use Tailwind CSS utility classes. Modify classes in `App.jsx` or customize the theme in `tailwind.config.js`.

## Notes

- Without a Finnhub API key, the app uses realistic simulated data that updates every 3 seconds
- With a valid API key, the app fetches real market data on startup
- The application automatically reconnects if the WebSocket connection is lost
- Market data is for demonstration purposes only and should not be used for trading decisions

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Disclaimer

This application is for educational and demonstration purposes only. It is not financial advice and should not be used for making investment decisions.
