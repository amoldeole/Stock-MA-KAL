// ============================================================
// WebSocket Handler
// Real-time price updates and event broadcasting
// ============================================================

import { WebSocket } from 'ws';
import { stockService } from '../services/stock/stockDataService';
import { logger } from '../utils/logger';

interface WSClient {
  socket: WebSocket;
  subscriptions: Set<string>;
  lastPing: number;
}

const clients = new Map<string, WSClient>();

export async function setupWebSocket(socket: WebSocket, request: any) {
  const clientId = `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const client: WSClient = { socket, subscriptions: new Set(), lastPing: Date.now() };
  clients.set(clientId, client);

  logger.info({ clientId }, 'WebSocket client connected');

  socket.on('message', async (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      await handleMessage(clientId, message);
    } catch (err) {
      logger.warn({ err }, 'Invalid WebSocket message');
    }
  });

  socket.on('close', () => {
    clients.delete(clientId);
    logger.info({ clientId }, 'WebSocket client disconnected');
  });

  socket.on('error', (err) => {
    logger.error({ err, clientId }, 'WebSocket error');
    clients.delete(clientId);
  });

  // Send welcome
  socket.send(JSON.stringify({
    type: 'system_message',
    data: { message: 'Connected to Stock-MA-KAL WebSocket', level: 'info' },
  }));
}

async function handleMessage(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  client.lastPing = Date.now();

  switch (message.type) {
    case 'subscribe': {
      const symbols: string[] = Array.isArray(message.symbols)
        ? message.symbols
        : [message.symbol];

      symbols.forEach((s: string) => client.subscriptions.add(s.toUpperCase()));
      logger.debug({ clientId, symbols }, 'Subscribed');

      // Send immediate quotes
      for (const symbol of symbols) {
        const quote = await stockService.getQuote(symbol.toUpperCase());
        if (quote) {
          client.socket.send(JSON.stringify({ type: 'price_update', data: quote }));
        }
      }
      break;
    }

    case 'unsubscribe': {
      const symbols: string[] = Array.isArray(message.symbols)
        ? message.symbols
        : [message.symbol];

      symbols.forEach((s: string) => client.subscriptions.delete(s.toUpperCase()));
      break;
    }

    case 'ping': {
      client.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }
  }
}

// ─── Price Update Broadcaster ─────────────────────────────────

let broadcastInterval: NodeJS.Timeout | null = null;

export function startPriceBroadcaster() {
  if (broadcastInterval) return;

  broadcastInterval = setInterval(async () => {
    if (clients.size === 0) return;

    // Collect all unique subscriptions
    const allSymbols = new Set<string>();
    clients.forEach((c) => c.subscriptions.forEach((s) => allSymbols.add(s)));

    if (allSymbols.size === 0) return;

    // Fetch quotes
    const quotes = await Promise.all(
      Array.from(allSymbols).map((s) => stockService.getQuote(s))
    );

    // Broadcast to relevant clients
    quotes.forEach((quote) => {
      if (!quote) return;
      clients.forEach((client) => {
        if (client.subscriptions.has(quote.symbol)) {
          try {
            client.socket.send(JSON.stringify({ type: 'price_update', data: quote }));
          } catch {
            // Client may have disconnected
          }
        }
      });
    });
  }, 5000); // Every 5 seconds

  logger.info('Price broadcaster started');
}

export function stopPriceBroadcaster() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}
