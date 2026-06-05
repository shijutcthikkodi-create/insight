import { TradeSignal, TradeStatus, User } from '../types';

export interface WhatsAppConfig {
  groupLink: string;
  autoDispatchNewLink: boolean;
  gatewayType: 'DIRECT' | 'CALLMEBOT' | 'CUSTOM_WEBHOOK';
  callmebotKey: string;
  callmebotPhone: string;
  webhookUrl: string;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  groupLink: 'https://chat.whatsapp.com/IKEJXh5U635J8H88sB7Tyc-',
  autoDispatchNewLink: true,
  gatewayType: 'DIRECT',
  callmebotKey: '',
  callmebotPhone: '',
  webhookUrl: '',
};

const CONFIG_KEY = 'libra_whatsapp_config_cached';

export const getWhatsAppConfig = (): WhatsAppConfig => {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_WHATSAPP_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      return DEFAULT_WHATSAPP_CONFIG;
    }
  }
  return DEFAULT_WHATSAPP_CONFIG;
};

export const saveWhatsAppConfig = (config: WhatsAppConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

/**
 * Format a beautiful, highly scannable institutional-grade alert for WhatsApp
 */
export const formatSignalMessage = (signal: TradeSignal, isNew: boolean = true): string => {
  const isBuy = signal.action === 'BUY';
  const actionLabel = isBuy ? 'POTENTIAL UP' : 'POTENTIAL DOWN';
  const directionEmoji = isBuy ? '🟢' : '🔴';
  
  if (isNew) {
    let text = `📊 *INSIGHT APP NOTIFICATION* 📊\n`;
    text += `==================================\n\n`;
    text += `${directionEmoji} *Action:* ${actionLabel}\n`;
    text += `📈 *Instrument:* ${signal.instrument}\n`;
    text += `🔍 *Symbol:* ${signal.symbol}\n`;
    text += `🏷️ *Option Type:* ${signal.type}\n`;
    text += `💵 *Base Level:* ₹${Number(signal.entryPrice || 0).toFixed(2)}\n`;
    
    if (signal.stopLoss) {
      text += `🛡️ *Invalidation:* ₹${Number(signal.stopLoss).toFixed(2)}\n`;
    }
    
    if (signal.trailingSL) {
      text += `🧠 *Trailing Protection SL:* ₹${Number(signal.trailingSL).toFixed(2)}\n`;
    }
    
    if (signal.targets && signal.targets.length > 0) {
      text += `🎯 *PRL:* ${signal.targets.map((t, i) => `[PRL ${i+1}] ₹${Number(t).toFixed(1)}`).join(', ')}\n`;
    }
    
    if (signal.quantity) {
      text += `📦 *Quantity / Size:* ${signal.quantity}\n`;
    }
    
    text += `🌙 *Overnight BTST:* ${signal.isBTST ? 'YES (OVERNIGHT)' : 'NO'}\n`;
    
    if (signal.comment) {
      text += `💬 *Intel Comment:* "${signal.comment}"\n`;
    }
    
    text += `\n⏰ *Time:* ${new Date(signal.timestamp).toLocaleString('en-IN')}\n`;
    text += `\n⚠️ *Disclaimer:* Educational research only. Derivative trading carries structural capital risks.`;
    return text;
  } else {
    // Format an update alert
    let text = `🎯 *LIBRA SYSTEM SIGNAL UPDATE* 🎯\n`;
    text += `==================================\n\n`;
    text += `📈 *Trade:* ${signal.instrument} ${signal.symbol} ${signal.type}\n`;
    text += `📢 *New Status:* *${signal.status}*\n`;
    
    if (signal.pnlPoints !== undefined && signal.pnlPoints !== null) {
      const isProfit = Number(signal.pnlPoints) >= 0;
      const pnlEmoji = isProfit ? '💰' : '📉';
      text += `${pnlEmoji} *Realized PnL:* ${isProfit ? '+' : ''}${Number(signal.pnlPoints).toFixed(1)} Pts\n`;
    }
    
    if (signal.targetsHit !== undefined && signal.targetsHit > 0) {
      text += `🎯 *Levels Achieved:* Lvl ${signal.targetsHit} Done\n`;
    }
    
    if (signal.comment) {
      text += `💬 *Commentary:* "${signal.comment}"\n`;
    }
    
    text += `\n⏰ *Update Time:* ${new Date().toLocaleString('en-IN')}\n`;
    text += `🔐 *Terminal Secure Link:* Libra Quant Solutions`;
    return text;
  }
};

/**
 * Dispatches a WhatsApp notification to the group or registered subscribers.
 * Integrates direct browser deep-linking or background automated gateway APIs.
 */
export const dispatchWhatsAppMessage = async (
  message: string,
  targetPhone?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  const config = getWhatsAppConfig();
  const cleanPhone = targetPhone ? targetPhone.replace(/[^\d]/g, '') : '';
  
  if (config.gatewayType === 'DIRECT') {
    // Direct link deep redirection
    let webUrl = '';
    if (cleanPhone) {
      webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    } else {
      // Group Link
      webUrl = config.groupLink;
      // Since WhatsApp group links do not accept '?text=...' natively, we can prompt/instruct or
      // copy message to clipboard and open group page.
      try {
        await navigator.clipboard.writeText(message);
      } catch (e) {
        console.warn("Clipboard copy failed, using URL fallback", e);
      }
    }
    return { success: true, url: webUrl };
  } else if (config.gatewayType === 'CALLMEBOT') {
    // CallMeBot Automated Direct Messaging API (Free WhatsApp automated gateway)
    const apiKey = config.callmebotKey || '';
    const phone = targetPhone || config.callmebotPhone || '';
    
    if (!apiKey || !phone) {
      return { success: false, error: 'CallMeBot Phone Number or API Key missing.' };
    }
    
    const cleanSendPhone = phone.replace(/[^\d+]/g, '');
    const apiEndpoint = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanSendPhone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
    
    try {
      // POST or GET request to the automated CallMeBot API
      const res = await fetch(apiEndpoint, { mode: 'no-cors' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'CallMeBot dispatch failed' };
    }
  } else if (config.gatewayType === 'CUSTOM_WEBHOOK') {
    // Custom webhook automated broadcast (Pipedream, Make, Zapier or proprietary gate)
    const url = config.webhookUrl;
    if (!url) {
      return { success: false, error: 'Custom Webhook URL has not been defined.' };
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          recipient: cleanPhone || 'GROUP',
          timestamp: new Date().toISOString(),
          groupLink: config.groupLink
        })
      });
      
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: `Webhook returned status code ${response.status}` };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Custom Webhook POST failed' };
    }
  }
  
  return { success: false, error: 'Unknown gateway config' };
};
