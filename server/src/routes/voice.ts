// ============================================================
// Voice Command Routes
// NLP-style command parsing for voice input
// ============================================================

import { FastifyInstance } from 'fastify';
import { VoiceCommand, VoiceCommandResult, VoiceAction } from '@stock-ma-kal/shared';
import { logger } from '../utils/logger';

// Command patterns for voice parsing
const COMMAND_PATTERNS: {
  pattern: RegExp;
  action: VoiceAction;
  extract: (match: RegExpMatchArray) => Record<string, string>;
}[] = [
  {
    pattern: /(?:show|open|search|find|look up|get)\s+(?:stock\s+)?(.+?)(?:\s+(?:chart|price|quote|info))?$/i,
    action: 'search_stock',
    extract: (m) => ({ symbol: m[1].trim().toUpperCase() }),
  },
  {
    pattern: /(?:show|display|open)\s+(?:the\s+)?chart\s+(?:for\s+)?(.+)/i,
    action: 'show_chart',
    extract: (m) => ({ symbol: m[1].trim().toUpperCase() }),
  },
  {
    pattern: /(?:add|enable|show)\s+(.+?)\s+(?:indicator|ma|moving average)/i,
    action: 'add_indicator',
    extract: (m) => ({ indicator: m[1].trim() }),
  },
  {
    pattern: /(?:remove|disable|hide)\s+(.+?)\s+(?:indicator|ma|moving average)/i,
    action: 'remove_indicator',
    extract: (m) => ({ indicator: m[1].trim() }),
  },
  {
    pattern: /(?:switch|change|set)\s+(?:to\s+)?(.+?)\s+(?:timeframe|interval|period)/i,
    action: 'set_timeframe',
    extract: (m) => ({ timeframe: m[1].trim() }),
  },
  {
    pattern: /(?:set|create|add)\s+(?:an?\s+)?alert\s+(?:for\s+)?(.+?)(?:\s+(?:at|above|below)\s+(\d+))?/i,
    action: 'add_alert',
    extract: (m) => ({ symbol: m[1].trim(), price: m[2] || '' }),
  },
  {
    pattern: /(?:go\s+to|switch\s+to|open|show)\s+(?:the\s+)?(.+?)\s+(?:tab|page|section|view)/i,
    action: 'switch_tab',
    extract: (m) => ({ tab: m[1].trim() }),
  },
  {
    pattern: /(?:take|capture)\s+(?:a\s+)?screenshot/i,
    action: 'take_screenshot',
    extract: () => ({}),
  },
  {
    pattern: /(?:share|export|send)\s+(?:this\s+)?(?:analysis|chart|screen)/i,
    action: 'share_analysis',
    extract: () => ({}),
  },
  {
    pattern: /(?:open|show)\s+(?:the\s+)?settings/i,
    action: 'open_settings',
    extract: () => ({}),
  },
  {
    pattern: /(?:go\s+)?back/i,
    action: 'go_back',
    extract: () => ({}),
  },
  {
    pattern: /(?:compare|vs)\s+(.+?)\s+(?:and|vs|with)\s+(.+)/i,
    action: 'compare_stocks',
    extract: (m) => ({ symbol1: m[1].trim().toUpperCase(), symbol2: m[2].trim().toUpperCase() }),
  },
  {
    pattern: /(?:show|display|get)\s+(?:the\s+)?(?:trade\s+)?signals/i,
    action: 'show_signals',
    extract: () => ({}),
  },
  {
    pattern: /(?:export|download|save)\s+(?:the\s+)?data/i,
    action: 'export_data',
    extract: () => ({}),
  },
  {
    pattern: /(?:toggle|switch)\s+(?:dark|light)\s+(?:mode|theme)/i,
    action: 'toggle_dark_mode',
    extract: () => ({}),
  },
  // Timeframe shortcuts
  {
    pattern: /(?:1|one)\s+(?:minute|min|m)\b/i,
    action: 'set_timeframe',
    extract: () => ({ timeframe: '1m' }),
  },
  {
    pattern: /(?:5|five)\s+(?:minute|min|m)\b/i,
    action: 'set_timeframe',
    extract: () => ({ timeframe: '5m' }),
  },
  {
    pattern: /(?:15|fifteen)\s+(?:minute|min|m)\b/i,
    action: 'set_timeframe',
    extract: () => ({ timeframe: '15m' }),
  },
  {
    pattern: /(?:1|one)\s+(?:hour|h|hr)\b/i,
    action: 'set_timeframe',
    extract: () => ({ timeframe: '1h' }),
  },
  {
    pattern: /(?:1|one)\s+(?:day|d|daily)\b/i,
    action: 'set_timeframe',
    extract: () => ({ timeframe: '1d' }),
  },
  {
    pattern: /(?:1|one)\s+(?:week|w|weekly)\b/i,
    action: 'set_timeframe',
    extract: () => ({ timeframe: '1w' }),
  },
];

function parseVoiceCommand(text: string): VoiceCommand | null {
  for (const { pattern, action, extract } of COMMAND_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        id: crypto.randomUUID?.() || Date.now().toString(36),
        action,
        parameters: extract(match),
        confidence: 0.85 + Math.random() * 0.1,
        timestamp: Date.now(),
      };
    }
  }
  return null;
}

export async function voiceRoutes(app: FastifyInstance) {
  // Parse voice command from text
  app.post('/parse', async (request) => {
    const { text } = request.body as { text: string };

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'No text provided' };
    }

    const command = parseVoiceCommand(text.trim());

    if (!command) {
      return {
        success: true,
        data: {
          success: false,
          action: 'unknown',
          message: `I didn't understand "${text}". Try: "Show AAPL chart", "Add EMA indicator", "Set 5 minute timeframe"`,
        } as VoiceCommandResult,
      };
    }

    logger.info({ command }, 'Voice command parsed');

    const result: VoiceCommandResult = {
      success: true,
      action: command.action,
      message: generateResponse(command),
      data: command.parameters,
    };

    return { success: true, data: result };
  });

  // Get available commands help
  app.get('/commands', async () => {
    return {
      success: true,
      data: {
        commands: [
          { pattern: 'Show [stock] chart', example: 'Show AAPL chart' },
          { pattern: 'Search [stock]', example: 'Search Tesla' },
          { pattern: 'Add [indicator] indicator', example: 'Add EMA indicator' },
          { pattern: 'Remove [indicator] indicator', example: 'Remove SMA indicator' },
          { pattern: 'Set [timeframe] timeframe', example: 'Set 5 minute timeframe' },
          { pattern: 'Compare [stock1] and [stock2]', example: 'Compare AAPL and MSFT' },
          { pattern: 'Show signals', example: 'Show signals' },
          { pattern: 'Set alert for [stock] at [price]', example: 'Set alert for AAPL at 200' },
          { pattern: 'Toggle dark mode', example: 'Toggle dark mode' },
          { pattern: 'Take screenshot', example: 'Take screenshot' },
          { pattern: 'Share analysis', example: 'Share analysis' },
          { pattern: 'Go back', example: 'Go back' },
          { pattern: 'Export data', example: 'Export data' },
        ],
      },
    };
  });
}

function generateResponse(command: VoiceCommand): string {
  const { action, parameters } = command;

  switch (action) {
    case 'search_stock':
      return `Looking up ${parameters.symbol}...`;
    case 'show_chart':
      return `Opening chart for ${parameters.symbol}...`;
    case 'add_indicator':
      return `Adding ${parameters.indicator} indicator to chart`;
    case 'remove_indicator':
      return `Removing ${parameters.indicator} indicator`;
    case 'set_timeframe':
      return `Switching to ${parameters.timeframe} timeframe`;
    case 'add_alert':
      return parameters.price
        ? `Setting alert for ${parameters.symbol} at $${parameters.price}`
        : `Setting alert for ${parameters.symbol}`;
    case 'switch_tab':
      return `Opening ${parameters.tab}...`;
    case 'compare_stocks':
      return `Comparing ${parameters.symbol1} vs ${parameters.symbol2}`;
    case 'show_signals':
      return 'Fetching trade signals...';
    case 'take_screenshot':
      return 'Capturing screenshot...';
    case 'share_analysis':
      return 'Preparing to share...';
    case 'toggle_dark_mode':
      return 'Toggling theme...';
    case 'export_data':
      return 'Exporting data...';
    case 'go_back':
      return 'Going back';
    case 'open_settings':
      return 'Opening settings...';
    default:
      return 'Command received';
  }
}
