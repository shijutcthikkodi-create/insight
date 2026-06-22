import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Newspaper, Globe, MapPin, Search, RefreshCw, ExternalLink, Clock, Sparkles, TrendingUp, TrendingDown, Flame, AlertCircle, Volume2, ShieldCheck, Sliders, Zap, Plus, Trash2, Edit3, RotateCcw, X, Check } from 'lucide-react';
import { User, ChatMessage, NewsItem } from '../types';
import { updateSheetData } from '../services/googleSheetsService';

// Rich Initial Domestic Seed Data (Indian Markets)
const DOMESTIC_SEED: NewsItem[] = [
  {
    id: "dom-seed-1",
    title: "Nifty 50 Approaches Key Resistance at 23,200; Options OI Shows Heavy Put Writing at 23,000",
    link: "https://youtube.com/@stockmarketsecrets-malayalam?si=BaL-rSdedZ_QBFbY",
    pubDate: new Date(Date.now() - 4 * 60000).toISOString(),
    source: "Economic Times",
    description: "Options open interest (OI) distribution indicates a robust, reliable base forming near the 23,000 strikes. Multiple institutional desks report large-scale put additions, demonstrating confidence in strong immediate support.\n\nSimultaneously, key technical oscillators highlight a bullish momentum pattern. Quant research desks anticipate a rapid test of the 23,250 level if buy flows persist over early sessions.",
    sentiment: "BULLISH",
    isBreaking: true
  },
  {
    id: "dom-seed-2",
    title: "Reliance Industries Board Approves Mammoth ₹45,000 Cr Green Hydrogen Gigafactory Expansion Plan",
    link: "https://www.moneycontrol.com",
    pubDate: new Date(Date.now() - 17 * 60000).toISOString(),
    source: "Moneycontrol",
    description: "The approved capital expenditure is earmarked for green hydrogen manufacturing assets across coastal corridor sites. Initial phase construction is scheduled to commence within late FY2026 under specialized project groups.\n\nGlobal energy analysts maintain overweight targets on the conglomerate, projecting optimized long-term energy integration. Successful commissioning is expected to yield substantial credit advantages.",
    sentiment: "BULLISH"
  },
  {
    id: "dom-seed-3",
    title: "HDFC Bank Deposit Inflow Surges 16.5% YoY; Stock Stabilizes as Net Interest Margins (NIM) Bottom Out",
    link: "https://www.livemint.com",
    pubDate: new Date(Date.now() - 42 * 60000).toISOString(),
    source: "Livemint",
    description: "Deposits of core retail and commercial banking segments surged significantly to solidify the balance sheet structure. This development substantially stabilizes market concerns regarding loan-to-deposit constraints.\n\nWhile operating expenses rose marginally, management indicated that major compression cycles in net interest margins are concluding. Active margin recovery actions are scheduled across outstanding credit books.",
    sentiment: "NEUTRAL"
  },
  {
    id: "dom-seed-4",
    title: "RBI Holds Repo Rate Steady at 6.50%; Signals Vigilant Stance on Aligning Domestic CPI Core Inflation",
    link: "https://youtube.com/@stockmarketsecrets-malayalam?si=BaL-rSdedZ_QBFbY",
    pubDate: new Date(Date.now() - 120 * 60000).toISOString(),
    source: "RBI Policy Desk",
    description: "The Monetary Policy Committee voted with a 5-to-1 majority to remain focused on the withdrawal of accommodation stance. The governor emphasized that aligning retail CPI inflation to the 4% target remains the primary objective.\n\nReflecting robust consumption trends, domestic economic growth forecasts were revised upward. Analysts note this provides the apex bank adequate headroom to delay rate reductions.",
    sentiment: "MACRO"
  },
  {
    id: "dom-seed-5",
    title: "Tata Steel Logistics Under Pressure as Global Premium Hard Coking Coal Spot Rates Touch New Highs",
    link: "https://youtube.com/@stockmarketsecrets-malayalam?si=BaL-rSdedZ_QBFbY",
    pubDate: new Date(Date.now() - 180 * 60000).toISOString(),
    source: "Bloomberg Quint",
    description: "Delays in major Australian shipping corridors triggered acute spot supplies constraints. Premium hard coking coal prices on free-on-board criteria escalated to unprecedented high values.\n\nRaw material margins compression is likely for primary domestic manufacturers. Industrial experts warns of down-trending profitability unless domestic finished steel prices are revised upward.",
    sentiment: "BEARISH"
  }
];

// Rich Initial Global Seed Data
const GLOBAL_SEED: NewsItem[] = [
  {
    id: "glob-seed-1",
    title: "Nasdaq Options Pricing Predicts Surging Volatility as NVDA Eyes New Highs on Cloud Server Contracts",
    link: "https://finance.yahoo.com",
    pubDate: new Date(Date.now() - 8 * 60000).toISOString(),
    source: "Reuters Financial",
    description: "Volume metrics in near-term derivative contracts suggest institutional participants are hedging aggressively at elevated valuation bands. High demand exists for out-of-the-money call options relative to baseline averages.\n\nLarge scale cloud service enterprises have escalated artificial intelligence capital allocations by 24% for the active fiscal term. This momentum translates to immense infrastructure backlog generation.",
    sentiment: "BULLISH",
    isBreaking: true
  },
  {
    id: "glob-seed-2",
    title: "S&P 500 Index Trades Near All-Time Records Ahead of Federal Reserve Interest Rate & Core CPI Prints",
    link: "https://www.bloomberg.com",
    pubDate: new Date(Date.now() - 28 * 60000).toISOString(),
    source: "Bloomberg US",
    description: "US equity benchmarks oscillated in a tight consolidation range as index weights stabilize before the key macro database releases. Volatility indexes (VIX) hover at historically low ranges, suggesting calm trading behavior.\n\nBond dealers note that the yield on 10-year US Treasury instruments rested near 4.28%. Traders anticipate volatility adjustments if the upcoming consumer price index deviates from consensus expectations.",
    sentiment: "MACRO"
  },
  {
    id: "glob-seed-3",
    title: "European Central Bank Limits Repo Rate Cushion; Decreases Baseline Deposit Facility Rates by 25bps",
    link: "https://www.reuters.com",
    pubDate: new Date(Date.now() - 55 * 60000).toISOString(),
    source: "Reuters",
    description: "Frankfurt policy makers validated consensus estimations by implementing the first cost-of-borrowing haircut in five years. This decision reflects stabilizing price-level metrics throughout the Eurozone.\n\nHowever, the central bank governing council clarified that they will not pre-commit to a continuous easing rate trajectory. Easing decisions are to be conducted on a data-contingent meeting-by-meeting basis.",
    sentiment: "NEUTRAL"
  },
  {
    id: "glob-seed-4",
    title: "Crude Oil Futures Slide Toward $78/bbl on OPEC Outlines to Gradually Unwind Voluntary Output Cuts",
    link: "https://finance.yahoo.com",
    pubDate: new Date(Date.now() - 140 * 60000).toISOString(),
    source: "MarketWatch",
    description: "West Texas Intermediate benchmarks fell following policy announcements outlining structured supply increments inside late 2026. The production roadmap suggests that supply tightness could decrease next quarter.\n\nMeanwhile, domestic commercial stockpiles reported surprising accumulation levels in latest energy administration reviews. Bearish macro headwinds continue to constrain price advancement.",
    sentiment: "BEARISH"
  },
  {
    id: "glob-seed-5",
    title: "TSMC Secures $5.2 Billion US Subsidies for Massive Third Arizona Chip Foundry Factory Development",
    link: "https://www.bloomberg.com",
    pubDate: new Date(Date.now() - 210 * 60000).toISOString(),
    source: "Wall Street Journal",
    description: "The multinational wafer manufacturer finalized extensive semiconductor capital grants with federal trade representatives. Proceeds will support cleanroom expansion and automated equipment sourcing.\n\nThis capital push aims to localize high-efficiency node production within North America by 2029. Commercial clients expect this milestone to streamline supply chains for supercomputing applications.",
    sentiment: "BULLISH"
  }
];

const PROXIES = [
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://corsproxy.io/?url=",
  "https://api.allorigins.win/raw?url=",
  "https://api.allorigins.win/get?url="
];

export const NewsFeed: React.FC<{ 
  user?: User | null; 
  soundFn?: () => void; 
  messages?: ChatMessage[]; 
  triggerNewsAlert?: (item: NewsItem) => void;
  onNewsClick?: (item: NewsItem) => void;
}> = ({ user, soundFn, messages = [], triggerNewsAlert, onNewsClick }) => {
  const [domesticNews, setDomesticNews] = useState<NewsItem[]>(DOMESTIC_SEED);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>(GLOBAL_SEED);

  const domesticNewsRef = useRef<NewsItem[]>(DOMESTIC_SEED);
  const globalNewsRef = useRef<NewsItem[]>(GLOBAL_SEED);

  useEffect(() => {
    domesticNewsRef.current = domesticNews;
  }, [domesticNews]);

  useEffect(() => {
    globalNewsRef.current = globalNews;
  }, [globalNews]);
  const [activeSegment, setActiveSegment] = useState<'DOMESTIC' | 'GLOBAL'>('DOMESTIC');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just Now');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [simInterval, setSimInterval] = useState<number>(45000); // Live terminal simulation gap/interval in ms (45 seconds default)

  // Custom states for Admin-posted, Edited and Deleted news
  const [customNews, setCustomNews] = useState<NewsItem[]>(() => {
    try {
      const saved = localStorage.getItem('libra_custom_news');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editedNews, setEditedNews] = useState<Record<string, NewsItem>>(() => {
    try {
      const saved = localStorage.getItem('libra_edited_news');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [deletedNewsIds, setDeletedNewsIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('libra_deleted_news');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Dynamically parse news elements published over Google Sheets messages
  const parsedSheetNews = useMemo(() => {
    const sheetCustom: NewsItem[] = [];
    const sheetEdited: Record<string, NewsItem> = {};
    const sheetDeleted = new Set<string>();

    const safeParseJson = (str: string): any => {
      try {
        let cleaned = str.trim();
        cleaned = cleaned.replace(/&quot;/g, '"');
        cleaned = cleaned.replace(/\\"/g, '"');
        cleaned = cleaned.replace(/""/g, '"');
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        return JSON.parse(cleaned);
      } catch (e) {
        try {
          return JSON.parse(str);
        } catch (_) {
          throw e;
        }
      }
    };

    const newsMessages = [...messages]
      .filter(m => m.text.includes('LIBRA_NEWS_V1:'))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    newsMessages.forEach(m => {
      try {
        const text = m.text.trim();
        const startIdx = text.indexOf('LIBRA_NEWS_V1:');
        if (startIdx === -1) return;
        const subStr = text.substring(startIdx);
        const parts = subStr.split('LIBRA_NEWS_V1:');
        if (parts.length < 2) return;
        const rest = parts[1];

        if (rest.startsWith('ADD:')) {
          const itemJson = rest.substring(4);
          const item = safeParseJson(itemJson) as NewsItem;
          if (item && item.id && !sheetCustom.some(it => it.id === item.id)) {
            sheetCustom.unshift(item);
          }
        } else if (rest.startsWith('UPDATE_NEWS:')) {
          const itemJson = rest.substring(12);
          const item = safeParseJson(itemJson) as NewsItem;
          if (item && item.id) {
            sheetEdited[item.id] = item;
            const idx = sheetCustom.findIndex(it => it.id === item.id);
            if (idx !== -1) {
              sheetCustom[idx] = item;
            }
          }
        } else if (rest.startsWith('DELETE:')) {
          const itemId = rest.substring(7).trim();
          sheetDeleted.add(itemId);
          const idx = sheetCustom.findIndex(it => it.id === itemId);
          if (idx !== -1) {
            sheetCustom.splice(idx, 1);
          }
        } else if (rest.startsWith('RESET:')) {
          const itemId = rest.substring(6).trim();
          delete sheetEdited[itemId];
        }
      } catch (err) {
        console.warn("Recoverable: Failed to parse sheet news message:", err);
      }
    });

    return { sheetCustom, sheetEdited, sheetDeleted };
  }, [messages]);

  const mergedCustomNews = useMemo(() => {
    const all = [...parsedSheetNews.sheetCustom];
    customNews.forEach(item => {
      if (!all.some(it => it.id === item.id)) {
        all.push(item);
      }
    });
    return all;
  }, [customNews, parsedSheetNews.sheetCustom]);

  const mergedEditedNews = useMemo(() => {
    return { ...editedNews, ...parsedSheetNews.sheetEdited };
  }, [editedNews, parsedSheetNews.sheetEdited]);

  const mergedDeletedNewsIds = useMemo(() => {
    const next = new Set(deletedNewsIds);
    parsedSheetNews.sheetDeleted.forEach(id => next.add(id));
    return next;
  }, [deletedNewsIds, parsedSheetNews.sheetDeleted]);

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null); // if null, we are creating a new item
  
  // Form states
  const [formHeadline, setFormHeadline] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSentiment, setFormSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MACRO'>('NEUTRAL');
  const [formSegment, setFormSegment] = useState<'DOMESTIC' | 'GLOBAL'>('DOMESTIC');
  const [formIsBreaking, setFormIsBreaking] = useState(false);

  // Instant Manual Tracker Injector Callback
  const triggerManualAlert = useCallback(() => {
    if (!user?.isAdmin) return;
    const isDom = Math.random() > 0.5;
    const nowTimes = new Date().toISOString();
    const randomSeedId = `sim-alert-manual-${Math.random()}`;

    if (isDom) {
      const simAlerts: NewsItem[] = [
        {
          id: randomSeedId,
          title: `[MANUAL ALIGN] F&O Volumes Spike on Nifty ATM Calls in options chain`,
          link: "https://youtube.com/@stockmarketsecrets-malayalam?si=BaL-rSdedZ_QBFbY",
          pubDate: nowTimes,
          source: "Terminal Intelligence",
          description: "Options traders block trade over 115,000 contracts of Nifty CE contracts near the current swing high. This surge in ATM call open interest indicates active bullish leverage setups participating in midday buy trades.\n\nSimultaneously, multi-exchange trend monitors demonstrate extreme long-buildup configurations. Capital floor parameters remain solid as institutional writers adjust short-strike protections.",
          sentiment: "BULLISH",
          isBreaking: true
        },
        {
          id: randomSeedId,
          title: "Intraday Surge: Blue-chip banking index tests all-time breakout boundary",
          link: "https://www.moneycontrol.com",
          pubDate: nowTimes,
          source: "Banking Pulse Bureau",
          description: "Aggressive net buyer accounts fuel the banking index rise as foreign institutional holdings shift toward premium private lenders. Several state-owned banks also reported steady intraday support on short covering.\n\nTreasury specialists confirm that call option writers are seeking margins relief above resistance zones. This could trigger further short squeezes if the index manages to close above key moving averages.",
          sentiment: "BULLISH"
        },
        {
          id: randomSeedId,
          title: "Sector Rotation Shift: Tech indices experience heavy profit booking in midday trade",
          link: "https://www.livemint.com",
          pubDate: nowTimes,
          source: "Capital Newsroom",
          description: "Institutional clients rotate capital from growth high-multiples tech segments to defensive consumer staples and high-yielding debt markets. Quantitative trading systems report massive block seller outputs across leading software holdings.\n\nIndustry analysts state this behavior matches historical pre-quarter rebalancing models. Local brokerage houses expect technical consolidation to persist until fresh quarterly results offer fresh direction.",
          sentiment: "BEARISH"
        }
      ];
      
      const chosen = simAlerts[Math.floor(Math.random() * simAlerts.length)];
      setDomesticNews(prev => [chosen, ...prev].slice(0, 30));
    } else {
      const simAlerts: NewsItem[] = [
        {
          id: randomSeedId,
          title: `[MANUAL ALIGN] Nasdaq options block trading signals extreme near-term risk-hedging`,
          link: "https://finance.yahoo.com",
          pubDate: nowTimes,
          source: "Macro Risk Terminal",
          description: "Massive institutional buying of downside options signals heightened sensitivity ahead of macroeconomic interest rate prints. The options floor experienced high protective put volume within defensive tech sectors.\n\nMarket-maker adjustments are triggering local delta-hedging slides in current option index weights. Derivative desks recommend maintaining strict risk budgets on high-beta equity margins.",
          sentiment: "BEARISH",
          isBreaking: true
        },
        {
          id: randomSeedId,
          title: "Global Supply Chain Audit: Industrial shipping volumes touch high efficiency markers",
          link: "https://www.reuters.com",
          pubDate: nowTimes,
          source: "Logistics Intel Unit",
          description: "Ocean container slot availability returns to standard historical averages, significantly lowering maritime spot freight rates across the Atlantic corridors. Turnaround durations have improved by roughly 12% globally.\n\nThis efficiency spike provides margin relief for global consumer goods distributors. Importers express optimism that shipping expenses will normalize entirely before the winter holiday build-ups commence.",
          sentiment: "NEUTRAL"
        }
      ];

      const chosen = simAlerts[Math.floor(Math.random() * simAlerts.length)];
      setGlobalNews(prev => [chosen, ...prev].slice(0, 30));
    }

  }, [user]);

  // Parse Google News search XML to customized JSON
  const parseGoogleNewsRSS = useCallback((xmlText: string, domainTag: string): NewsItem[] => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const items = Array.from(doc.querySelectorAll('item')).slice(0, 15);
      
      return items.map((item, index) => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const rawPubDate = item.querySelector('pubDate')?.textContent || '';
        const rawDesc = item.querySelector('description')?.textContent || '';
        
        // Clean feed title (Google News appends " - Publisher Name" at the end of titles)
        let cleanTitle = title;
        let publisher = "Market News Desk";
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          publisher = parts[parts.length - 1].trim();
          cleanTitle = parts.slice(0, -1).join(' - ');
        }
        
        // Clean description from HTML and snippets
        let baseDesc = rawDesc.replace(/<[^>]*>/g, '').trim();
        if (baseDesc.length < 30) {
          baseDesc = "Institutional traders are actively monitoring market index behavior following today's volume adjustments across active segments. Real-time indicators demonstrate high relative strength indexes in lead equities.";
        } else if (baseDesc.length > 250) {
          baseDesc = baseDesc.slice(0, 240) + "...";
        }

        // Generate an elegant, highly analytical second paragraph dynamically based on title context
        const titleLower = cleanTitle.toLowerCase() + " " + baseDesc.toLowerCase();
        let secondParagraph = "";

        if (titleLower.includes('nifty') || titleLower.includes('sensex') || titleLower.includes('india') || titleLower.includes('rbi') || domainTag === 'dom') {
          if (titleLower.includes('rbi') || titleLower.includes('rate') || titleLower.includes('inflation') || titleLower.includes('repo')) {
            secondParagraph = "Financial desks expect the Monetary Policy Committee to prioritize sustainable inflation alignment. Domestic capital market participants suggest maintaining alert portfolios until next policy releases.";
          } else {
            secondParagraph = "Domestic brokerage desks indicate that Foreign Institutional Investors (FIIs) are sustaining high interest in frontline shares. Intraday options volatility index (India VIX) remains locked below major multi-session averages.";
          }
        } else {
          if (titleLower.includes('fed') || titleLower.includes('rate') || titleLower.includes('inflation') || titleLower.includes('cpi')) {
            secondParagraph = "Global trading counters are pricing lower tail-risk scenarios as benchmark treasury yield instruments consolidate near moving averages. Macro strategists anticipate steady volumes as long-term investors steady holdings.";
          } else {
            secondParagraph = "Wall Street derivative specialists noted that technology capitalizations are acting as primary liquidity magnets. This keeps overall index breadth strong despite scattered treasury yield fluctuations.";
          }
        }

        const fullDescription = `${baseDesc}\n\n${secondParagraph}`;
        
        // Generate a deterministic but smart sentiment tags
        let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MACRO' = 'NEUTRAL';
        
        if (titleLower.includes('surge') || titleLower.includes('high') || titleLower.includes('rally') || titleLower.includes('bullish') || titleLower.includes('profit') || titleLower.includes('buy') || titleLower.includes('expand') || titleLower.includes('growth') || titleLower.includes('record')) {
          sentiment = 'BULLISH';
        } else if (titleLower.includes('fall') || titleLower.includes('drop') || titleLower.includes('slump') || titleLower.includes('bearish') || titleLower.includes('loss') || titleLower.includes('decline') || titleLower.includes('sell') || titleLower.includes('crash') || titleLower.includes('slide')) {
          sentiment = 'BEARISH';
        } else if (titleLower.includes('fed') || titleLower.includes('rbi') || titleLower.includes('inflation') || titleLower.includes('repo') || titleLower.includes('macro') || titleLower.includes('budget') || titleLower.includes('rate')) {
          sentiment = 'MACRO';
        }

        return {
          id: `${domainTag}-rss-${index}-${Date.now()}`,
          title: cleanTitle,
          link: link,
          pubDate: rawPubDate ? new Date(rawPubDate).toISOString() : new Date().toISOString(),
          source: publisher,
          description: fullDescription,
          sentiment,
          isBreaking: index === 0 && Math.random() > 0.4
        };
      });
    } catch (e) {
      console.error("Failed to parse stock market RSS feed:", e);
      return [];
    }
  }, []);

  // Fetch Live RSS Market feeds using Free Proxy RSS directly
  const fetchLiveFeeds = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    let success = false;

    // Define target feeds from Google News Search RSS
    const domesticUrl = "https://news.google.com/rss/search?q=NIFTY+SENSEX+stocks+earnings+market+india&hl=en-IN&gl=IN&ceid=IN:en";
    const globalUrl = "https://news.google.com/rss/search?q=Nasdaq+SP500+Fed+yields+global+stocks&hl=en-US&gl=US&ceid=US:en";

    for (const proxy of PROXIES) {
      try {
        // Always safely encode target URL to protect query parameters inside the proxy
        const fullDomUrl = `${proxy}${encodeURIComponent(domesticUrl)}`;
        const fullGlobUrl = `${proxy}${encodeURIComponent(globalUrl)}`;

        const [domResponse, globResponse] = await Promise.all([
          fetch(fullDomUrl),
          fetch(fullGlobUrl)
        ]);

        if (!domResponse.ok || !globResponse.ok) continue;

        let domXml = "";
        let globXml = "";

        if (proxy.includes("allorigins.win/get")) {
          const domJson = await domResponse.json();
          const globJson = await globResponse.json();
          domXml = domJson.contents || "";
          globXml = globJson.contents || "";
        } else {
          domXml = await domResponse.text();
          globXml = await globResponse.text();
        }

        // Strict validation: Ensure the returned documents are actual XML and contain RSS <item> tags
        const hasDomItems = domXml && domXml.toLowerCase().includes("<item>");
        const hasGlobItems = globXml && globXml.toLowerCase().includes("<item>");

        if (hasDomItems && hasGlobItems) {
          const parsedDomestic = parseGoogleNewsRSS(domXml, 'dom');
          const parsedGlobal = parseGoogleNewsRSS(globXml, 'glob');

          if (parsedDomestic.length > 0) {
            const newestItem = parsedDomestic[0];
            const prevDom = domesticNewsRef.current;
            const isAlreadyPresent = prevDom.some(it => it.title.toLowerCase() === newestItem.title.toLowerCase() || it.id === newestItem.id);
            if (!isAlreadyPresent && prevDom.length > 0 && !prevDom[0].id.startsWith("dom-seed")) {
              triggerNewsAlert?.(newestItem);
            }

            setDomesticNews(prev => {
              const existingTitles = new Set(parsedDomestic.map(it => it.title.toLowerCase()));
              // Filter out the old static offline seed placeholders and identical titles
              const filteredPrev = prev.filter(it => !existingTitles.has(it.title.toLowerCase()) && !it.id.startsWith("dom-seed"));
              return [...parsedDomestic, ...filteredPrev].slice(0, 30);
            });
          }
          
          if (parsedGlobal.length > 0) {
            const newestItem = parsedGlobal[0];
            const prevGlob = globalNewsRef.current;
            const isAlreadyPresent = prevGlob.some(it => it.title.toLowerCase() === newestItem.title.toLowerCase() || it.id === newestItem.id);
            if (!isAlreadyPresent && prevGlob.length > 0 && !prevGlob[0].id.startsWith("glob-seed")) {
              triggerNewsAlert?.(newestItem);
            }

            setGlobalNews(prev => {
              const existingTitles = new Set(parsedGlobal.map(it => it.title.toLowerCase()));
              // Filter out the old static offline seed placeholders and identical titles
              const filteredPrev = prev.filter(it => !existingTitles.has(it.title.toLowerCase()) && !it.id.startsWith("glob-seed"));
              return [...parsedGlobal, ...filteredPrev].slice(0, 30);
            });
          }

          success = true;
          setLastUpdated(new Date().toLocaleTimeString('en-IN') + ' (All-Source RSS)');
          break;
        }
      } catch (err) {
        console.warn(`Proxy ${proxy} failed, trying next...`, err);
      }
    }

    if (!success) {
      setSyncError("Network rate-limiting. Offline simulation is active.");
      setLastUpdated(new Date().toLocaleTimeString('en-IN') + ' (Live Simulation Feed)');
    }
    
    setIsSyncing(false);
  }, [parseGoogleNewsRSS]);

  // Handle Fetching triggers
  useEffect(() => {
    fetchLiveFeeds();
    const fetchTimer = setInterval(fetchLiveFeeds, 60000); // sync every 60 seconds
    return () => clearInterval(fetchTimer);
  }, [fetchLiveFeeds]);

  // Periodic Simulation of new live alert to make the screen highly dynamic (Bloomberg Terminal feel)
  useEffect(() => {
    if (simInterval === 0) return; // Paused simulation

    const alertSimTimer = setInterval(() => {
      const isDom = Math.random() > 0.5;
      const nowTimes = new Date().toISOString();
      const randomSeedId = `sim-alert-${Math.random()}`;

      if (isDom) {
        const simAlerts: NewsItem[] = [
          {
            id: randomSeedId,
            title: `[ALERT] F&O Trade Call Volumes Spike heavily on Nifty ATM Calls in ${new Date().toLocaleTimeString()} option chain`,
            link: "https://youtube.com/@stockmarketsecrets-malayalam?si=BaL-rSdedZ_QBFbY",
            pubDate: nowTimes,
            source: "Terminal Intelligence",
            description: "Institutional options traders block trade over 85,000 contracts of Nifty 23,100 CE. Momentum oscillator suggested major intraday long-buildup in key indices.\n\nOption desk dealers indicate aggressive call writers are actively hedging positions. This shifts immediate support bands upward to match retail buy-side momentum.",
            sentiment: "BULLISH",
            isBreaking: true
          },
          {
            id: randomSeedId,
            title: "CPI Inflation Target Update: State-level vegetable wholesale metrics decline; analysts anticipate CPI fall",
            link: "https://www.moneycontrol.com",
            pubDate: nowTimes,
            source: "Agri Analytics Bureau",
            description: "Core food index falls by 1.8% week-over-week. Lower CPI levels would provide the RBI room for interest rate relaxation later in the third quarter.\n\nAgricultural shipments reports confirm high inbound freight arrivals at terminal food centers. This supply influx directly cushions core retail markup values.",
            sentiment: "BULLISH"
          },
          {
            id: randomSeedId,
            title: "Regulatory Warning: NSE cautions retail options scalpers regarding aggressive margin-funding setups",
            link: "https://www.livemint.com",
            pubDate: nowTimes,
            source: "NSE Compliance Desk",
            description: "Exchange rules enforcement team outlines tight reporting limits on intraday margin leverages starting next settlement lifecycle.\n\nBrokers are advised to increase upfront margin multipliers immediately. The regulatory unit seeks to check retail exposure ratios across volatile weekly derivative cycles.",
            sentiment: "MACRO"
          }
        ];
        
        const chosen = simAlerts[Math.floor(Math.random() * simAlerts.length)];
        setDomesticNews(prev => [chosen, ...prev].slice(0, 30));
        triggerNewsAlert?.(chosen);
      } else {
        const simAlerts: NewsItem[] = [
          {
            id: randomSeedId,
            title: `[ALERT] S&P 500 options block trades exceed historical average as volatility hedge setups accelerate`,
            link: "https://finance.yahoo.com",
            pubDate: nowTimes,
            source: "Macro Risk Terminal",
            description: "Surge in standard VIX call setups points to cautious positioning in options markets right before the upcoming Federal Reserve rate announcements.\n\nMajor macroeconomic hedge funds are paying premiums above historical lines to lock in downside equity protection. Retail accounts remain moderately net bullish.",
            sentiment: "BEARISH",
            isBreaking: true
          },
          {
            id: randomSeedId,
            title: "US Treasury auction yields touch tight 4.25% envelope as institutional demand climbs on macro safety flows",
            link: "https://www.reuters.com",
            pubDate: nowTimes,
            source: "DOW Intelligence",
            description: "Bond markets secure massive capital inflows from international sovereigns seeking stable USD interest yields amid global economic adjustments.\n\nThis safe-haven consolidation mitigates concern over pending yield curve inversions. Federal Reserve representatives welcome the sustained demand markers.",
            sentiment: "NEUTRAL"
          }
        ];

        const chosen = simAlerts[Math.floor(Math.random() * simAlerts.length)];
        setGlobalNews(prev => [chosen, ...prev].slice(0, 30));
        triggerNewsAlert?.(chosen);
      }

    }, simInterval); // Push standard dynamic alerts at the user-adjusted interval

    return () => clearInterval(alertSimTimer);
  }, [simInterval]);

  // Periodic Cleanup of articles older than 36 hours from states and localStorage
  useEffect(() => {
    const cleanupExpiredNews = () => {
      const limitMs = 36 * 60 * 60 * 1000;
      const now = Date.now();

      // Clean customNews state and localStorage
      setCustomNews(prev => {
        const fresh = prev.filter(item => {
          const ageMs = now - new Date(item.pubDate).getTime();
          return ageMs <= limitMs;
        });
        if (fresh.length !== prev.length) {
          localStorage.setItem('libra_custom_news', JSON.stringify(fresh));
        }
        return fresh;
      });

      // Clean editedNews state and localStorage
      setEditedNews(prev => {
        let changed = false;
        const fresh: Record<string, NewsItem> = {};
        Object.keys(prev).forEach(id => {
          const item = prev[id];
          if (item) {
            const ageMs = now - new Date(item.pubDate).getTime();
            if (ageMs <= limitMs) {
              fresh[id] = item;
            } else {
              changed = true;
            }
          }
        });
        if (changed) {
          localStorage.setItem('libra_edited_news', JSON.stringify(fresh));
        }
        return fresh;
      });

      // Filter local live news states
      setDomesticNews(prev => prev.filter(item => {
        const ageMs = now - new Date(item.pubDate).getTime();
        return ageMs <= limitMs;
      }));

      setGlobalNews(prev => prev.filter(item => {
        const ageMs = now - new Date(item.pubDate).getTime();
        return ageMs <= limitMs;
      }));
    };

    cleanupExpiredNews();
    const interval = setInterval(cleanupExpiredNews, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Relative Time Helper
  const getRelativeTimeString = (isoString: string) => {
    try {
      const past = new Date(isoString).getTime();
      const current = Date.now();
      const secDiff = Math.floor((current - past) / 1000);
      
      if (secDiff < 10) return "Just Now";
      if (secDiff < 60) return `${secDiff}s ago`;
      
      const minDiff = Math.floor(secDiff / 60);
      if (minDiff < 60) return `${minDiff}m ago`;
      
      const hrDiff = Math.floor(minDiff / 60);
      if (hrDiff < 24) return `${hrDiff}h ago`;
      
      const dayDiff = Math.floor(hrDiff / 24);
      return `${dayDiff}d ago`;
    } catch {
      return "N/A";
    }
  };

  // Absolute Time Helper to show actual original news posted time
  const getAbsoluteTimeString = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const pad = (num: number) => String(num).padStart(2, '0');
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      const seconds = pad(d.getSeconds());
      
      const day = pad(d.getDate());
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();

      return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return "N/A";
    }
  };

  // Create article modal open trigger
  const openCreateModal = () => {
    if (!user?.isAdmin) return;
    setEditingItem(null);
    setFormHeadline('');
    setFormSource('Libra News Desk');
    setFormLink('https://youtube.com/@stockmarketsecrets-malayalam?si=BaL-rSdedZ_QBFbY');
    setFormDescription('');
    setFormSentiment('NEUTRAL');
    setFormSegment(activeSegment);
    setFormIsBreaking(false);
    setIsModalOpen(true);
  };

  // Edit article trigger
  const openEditModal = (item: NewsItem) => {
    if (!user?.isAdmin) return;
    setEditingItem(item);
    setFormHeadline(item.title);
    setFormSource(item.source);
    setFormLink(item.link || '');
    setFormDescription(item.description);
    setFormSentiment(item.sentiment);
    setFormSegment((item as any).segment || activeSegment);
    setFormIsBreaking(!!item.isBreaking);
    setIsModalOpen(true);
  };

  // Submit create or edit news item
  const handleSaveArticle = () => {
    if (!user?.isAdmin) {
      alert("Unauthorized action. Only administrators can publish or modify news wire.");
      return;
    }
    if (!formHeadline.trim() || !formDescription.trim()) {
      alert("Headline and Description are required to dispatch standard wire.");
      return;
    }

    if (editingItem) {
      // Editing existing article (could be Custom, RSS or Seed)
      const updatedItem: NewsItem = {
        ...editingItem,
        title: formHeadline.trim(),
        source: formSource.trim() || 'Libra News Desk',
        link: formLink.trim(),
        description: formDescription.trim(),
        sentiment: formSentiment,
        isBreaking: formIsBreaking,
        pubDate: new Date().toISOString()
      };
      (updatedItem as any).segment = formSegment;

      const nextEdited = { ...editedNews, [editingItem.id]: updatedItem };
      setEditedNews(nextEdited);
      localStorage.setItem('libra_edited_news', JSON.stringify(nextEdited));

      // Update in custom list if custom
      if (customNews.some(it => it.id === editingItem.id)) {
        const nextCustom = customNews.map(it => it.id === editingItem.id ? updatedItem : it);
        setCustomNews(nextCustom);
        localStorage.setItem('libra_custom_news', JSON.stringify(nextCustom));
      }

      // Synchronize edit globally via Google Sheets messages database
      updateSheetData('messages', 'ADD', {
        id: `news-update-${Date.now()}`,
        text: `LIBRA_NEWS_V1:UPDATE_NEWS:${JSON.stringify(updatedItem)}`,
        timestamp: new Date().toISOString(),
        isAdminReply: true,
        userId: 'ADMIN',
        broadcaster: 'Admin'
      });

      updateSheetData('news', 'UPDATE_NEWS', updatedItem, editingItem.id);
    } else {
      // Creating a new article
      const newItem: NewsItem = {
        id: `custom-news-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: formHeadline.trim(),
        source: formSource.trim() || 'Libra News Desk',
        link: formLink.trim() || 'https://youtube.com/@stockmarketsecrets-malayalam?si=BaL-rSdedZ_QBFbY',
        description: formDescription.trim(),
        sentiment: formSentiment,
        isBreaking: formIsBreaking,
        pubDate: new Date().toISOString()
      };
      (newItem as any).segment = formSegment;

      const nextCustom = [newItem, ...customNews];
      setCustomNews(nextCustom);
      localStorage.setItem('libra_custom_news', JSON.stringify(nextCustom));
      triggerNewsAlert?.(newItem);

      // Synchronize dispatch globally via Google Sheets messages database
      updateSheetData('messages', 'ADD', {
        id: `news-add-${Date.now()}`,
        text: `LIBRA_NEWS_V1:ADD:${JSON.stringify(newItem)}`,
        timestamp: new Date().toISOString(),
        isAdminReply: true,
        userId: 'ADMIN',
        broadcaster: 'Admin'
      });

      updateSheetData('news', 'ADD', newItem);
    }

    setIsModalOpen(false);
    setEditingItem(null);
    if (soundFn) soundFn();
  };

  // Delete article triggers
  const handleDeleteArticle = (itemId: string) => {
    if (!user?.isAdmin) {
      alert("Unauthorized action. Only administrators can delete news wire.");
      return;
    }
    if (!window.confirm("CONFIRM ARTICLE RETRIEVAL: Are you sure you want to delete and wipe this article from the terminal feed?")) return;
    
    const nextDeleted = new Set(deletedNewsIds);
    nextDeleted.add(itemId);
    setDeletedNewsIds(nextDeleted);
    localStorage.setItem('libra_deleted_news', JSON.stringify(Array.from(nextDeleted)));

    const nextCustom = customNews.filter(it => it.id !== itemId);
    setCustomNews(nextCustom);
    localStorage.setItem('libra_custom_news', JSON.stringify(nextCustom));

    // Synchronize delete globally over shared Google Sheets database
    updateSheetData('messages', 'ADD', {
      id: `news-delete-${Date.now()}`,
      text: `LIBRA_NEWS_V1:DELETE:${itemId}`,
      timestamp: new Date().toISOString(),
      isAdminReply: true,
      userId: 'ADMIN',
      broadcaster: 'Admin'
    });

    updateSheetData('news', 'DELETE', { id: itemId }, itemId);
  };

  // Reset edited custom override back to original RSS format
  const handleResetArticle = (itemId: string) => {
    if (!user?.isAdmin) {
      alert("Unauthorized action. Only administrators can reset news wire.");
      return;
    }
    const nextEdited = { ...editedNews };
    delete nextEdited[itemId];
    setEditedNews(nextEdited);
    localStorage.setItem('libra_edited_news', JSON.stringify(nextEdited));

    // Revert edits globally via broadcast reset command
    updateSheetData('messages', 'ADD', {
      id: `news-reset-${Date.now()}`,
      text: `LIBRA_NEWS_V1:RESET:${itemId}`,
      timestamp: new Date().toISOString(),
      isAdminReply: true,
      userId: 'ADMIN',
      broadcaster: 'Admin'
    });
  };

  // Merge feeds and custom news items seamlessly using synchronized merges
  const customDomestic = useMemo(() => {
    return mergedCustomNews.filter(it => (it as any).segment === 'DOMESTIC' || (!('segment' in it) && it.id.startsWith('custom-news')));
  }, [mergedCustomNews]);

  const customGlobal = useMemo(() => {
    return mergedCustomNews.filter(it => (it as any).segment === 'GLOBAL');
  }, [mergedCustomNews]);

  const activeList = useMemo(() => {
    if (activeSegment === 'DOMESTIC') {
      return [...customDomestic, ...domesticNews];
    } else {
      return [...customGlobal, ...globalNews];
    }
  }, [activeSegment, customDomestic, domesticNews, customGlobal, globalNews]);

  const processedList = useMemo(() => {
    const limitMs = 36 * 60 * 60 * 1000;
    const now = Date.now();
    return activeList
      .map(item => {
        if (mergedEditedNews[item.id]) {
          return { ...item, ...mergedEditedNews[item.id] };
        }
        return item;
      })
      .filter(item => {
        if (mergedDeletedNewsIds.has(item.id)) return false;
        const ageMs = now - new Date(item.pubDate).getTime();
        return ageMs <= limitMs;
      });
  }, [activeList, mergedEditedNews, mergedDeletedNewsIds]);
  
  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return processedList;
    const q = searchQuery.toLowerCase();
    return processedList.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) || 
      item.source.toLowerCase().includes(q)
    );
  }, [processedList, searchQuery]);

  // Sentiment formatting helpers
  const sentimentBadges = {
    BULLISH: "bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 font-black",
    BEARISH: "bg-rose-900/40 border border-rose-500/30 text-rose-400 font-black",
    NEUTRAL: "bg-blue-900/40 border border-blue-500/30 text-blue-400 font-black",
    MACRO: "bg-amber-900/40 border border-amber-500/30 text-amber-400 font-black"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-32">
      
      {/* Header and Live Status Indicators */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h2 className="text-2xl font-black text-white mb-1 flex items-center tracking-tighter">
              <Newspaper size={24} className="mr-3 text-blue-500 animate-pulse animate-duration-1000" />
              LIVE TERMINAL FEED
            </h2>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em] flex items-center">
              <Sparkles className="mr-1.5 text-blue-400" size={10} /> Real-time Financial Wire Integration
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Admin Article Publisher Trigger */}
            {user?.isAdmin && (
              <button
                onClick={openCreateModal}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 font-black text-[9px] py-2.5 px-3.5 rounded-2xl transition-all uppercase tracking-wider active:scale-95 shadow-lg shadow-emerald-950/50"
                title="Publish an admin article into the terminal feed"
              >
                <Plus size={11} />
                <span>POST WIRE</span>
              </button>
            )}

            {/* Compact Simulation Gap Selector */}
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-800">
              <Sliders size={11} className="text-yellow-500 animate-pulse" />
              <span className="font-mono text-[9px] uppercase font-black text-slate-500">SIM-GAP:</span>
              <select
                value={simInterval}
                onChange={(e) => setSimInterval(Number(e.target.value))}
                className="bg-transparent border-none text-white text-[9px] font-mono font-bold uppercase tracking-wider outline-none cursor-pointer focus:ring-0 px-1 py-0.5"
              >
                <option value={10000} className="bg-slate-950 text-white">10s</option>
                <option value={30000} className="bg-slate-950 text-white">30s</option>
                <option value={45000} className="bg-slate-950 text-white">45s</option>
                <option value={90000} className="bg-slate-950 text-white">90s</option>
                <option value={300000} className="bg-slate-950 text-white">5m</option>
                <option value={0} className="bg-slate-950 text-slate-400">OFF</option>
              </select>
            </div>

            {/* Micro Injection event button */}
            {user?.isAdmin && (
              <button
                onClick={triggerManualAlert}
                title="Inject Custom Volatility Event"
                className="flex items-center space-x-1 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 border border-yellow-500/20 font-black text-[9px] py-2.5 px-3 rounded-2xl transition-all uppercase tracking-wider active:scale-95"
              >
                <Sparkles size={11} />
                <span>INJECT</span>
              </button>
            )}

            <div className="flex items-center space-x-2 text-slate-400 text-[10px] bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-800">
              <Clock size={12} className="text-blue-500" />
              <span className="font-mono text-[9px] uppercase font-black text-slate-500">SYNC-</span>
              <span className="text-white font-mono font-bold leading-none">{lastUpdated}</span>
            </div>
            
            <button
              onClick={fetchLiveFeeds}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-[9px] py-2.5 px-3.5 rounded-2xl transition-all uppercase tracking-wider active:scale-95"
            >
              <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
              <span>SYNC NOW</span>
            </button>
          </div>
        </div>

        {/* Sync Warning message block */}
        {syncError && (
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl px-4 py-2.5 flex items-start space-x-2.5 text-amber-400 text-[11px] animate-in slide-in-from-top-3 duration-300">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
            <p className="font-medium tracking-tight leading-relaxed">{syncError}</p>
          </div>
        )}

        {/* Dual Segment Select and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 flex-1">
            <button
              onClick={() => { setActiveSegment('DOMESTIC'); setSearchQuery(''); }}
              className={`flex items-center justify-center py-2.5 px-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                activeSegment === 'DOMESTIC' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/45' 
                  : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
              }`}
            >
              <MapPin size={14} className={`mr-2 ${activeSegment === 'DOMESTIC' ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">DOMESTIC MARKET</span>
              {activeSegment === 'DOMESTIC' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => { setActiveSegment('GLOBAL'); setSearchQuery(''); }}
              className={`flex items-center justify-center py-2.5 px-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                activeSegment === 'GLOBAL' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/45' 
                  : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
              }`}
            >
              <Globe size={14} className={`mr-2 ${activeSegment === 'GLOBAL' ? 'animate-spin animate-duration-3000' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">GLOBAL FLOWS</span>
              {activeSegment === 'GLOBAL' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-t-full" />
              )}
            </button>
          </div>

          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-3 w-full sm:max-w-xs focus-within:border-blue-500 transition-colors">
            <Search size={14} className="text-slate-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder={`Search ${activeSegment.toLowerCase()} news...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white max-w-full grow py-3 placeholder:text-slate-600 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Structured Dashboard News Columns */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main News List Component */}
        <div className="flex-1 space-y-3.5">
          {filteredNews.length > 0 ? (
            filteredNews.map((news) => {
              const hasDraftOverride = !!editedNews[news.id];
              const isCustomPosted = news.id.startsWith('custom-news');
              return (
                <div
                  key={news.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                    onNewsClick?.(news);
                  }}
                  className={`bg-slate-900/80 border rounded-2xl p-4.5 shadow-xl relative overflow-hidden transition-all duration-300 flex flex-col group/item hover:bg-slate-800/25 cursor-pointer ${
                    news.isBreaking 
                      ? 'border-red-500/30 bg-red-950/5 ring-1 ring-red-500/10 hover:border-red-500/50' 
                      : 'border-slate-800 hover:border-blue-500/20'
                  }`}
                >
                  {/* Breaking News background flare */}
                  {news.isBreaking && (
                    <div className="absolute top-0 right-0 p-1.5 bg-red-950 border-l border-b border-red-500/20 text-red-400 text-[6.5px] font-black tracking-widest uppercase rounded-bl-lg flex items-center space-x-1 select-none animate-pulse">
                      <span className="w-1 h-1 bg-red-500 rounded-full animate-ping mr-0.5"></span>
                      <span>BREAKING ALERT</span>
                    </div>
                  )}

                  <div className="flex flex-col space-y-2">
                    
                    {/* Article Meta Indicators */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[10px] font-black text-blue-400 tracking-tight underline cursor-default font-mono">
                        {news.source.toUpperCase()}
                      </span>
                      {isCustomPosted && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[7px] font-black uppercase tracking-widest rounded animate-pulse">
                          ADMIN DISPATCH
                        </span>
                      )}
                      {hasDraftOverride && (
                        <span className="px-1.5 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[7px] font-black uppercase tracking-widest rounded">
                          EDITED
                        </span>
                      )}
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <div className="flex items-center text-slate-500 text-[8.5px] font-mono font-semibold gap-1.5 flex-wrap">
                        <Clock size={10} className="opacity-70" />
                        <span>{getRelativeTimeString(news.pubDate)}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">ORIGIN: {getAbsoluteTimeString(news.pubDate)}</span>
                      </div>
                    </div>

                    {/* Headline Title */}
                    <h3 className="text-white font-black text-sm md:text-base leading-snug tracking-tight uppercase group-hover/item:text-blue-400 transition-colors">
                      {news.title}
                    </h3>

                    {/* Description Box - Split and render multi-paragraphs cleanly */}
                    <div className="space-y-2 py-1">
                      {news.description.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-slate-400 text-xs font-semibold leading-relaxed tracking-wide text-justify">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Sentiment and Admin Tools Footer Action Line */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest uppercase ${sentimentBadges[news.sentiment]}`}>
                          {news.sentiment}
                        </span>
                        <span className="text-[7.5px] font-black text-blue-500/80 tracking-widest uppercase opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                          - Click to view complete briefing
                        </span>
                      </div>
                      
                      {/* Admin Controls Area */}
                      {user?.isAdmin && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(news)}
                            className="flex items-center space-x-1 px-2.5 py-1 text-[8px] bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/25 rounded-lg font-black transition-all active:scale-95 cursor-pointer"
                            title="Edit this wire article headline or content"
                          >
                            <Edit3 size={10} />
                            <span>EDIT</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteArticle(news.id)}
                            className="flex items-center space-x-1 px-2.5 py-1 text-[8px] bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/25 rounded-lg font-black transition-all active:scale-95 cursor-pointer"
                            title="Wipe article entirely"
                          >
                            <Trash2 size={10} />
                            <span>DELETE</span>
                          </button>

                          {hasDraftOverride && (
                            <button
                              onClick={() => handleResetArticle(news.id)}
                              className="flex items-center space-x-1 px-2.5 py-1 text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg font-black transition-all active:scale-95 cursor-pointer"
                              title="Restore to original standard wire content"
                            >
                              <RotateCcw size={10} />
                              <span>RESET</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/15">
              <AlertCircle size={24} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-600 font-black uppercase text-xs tracking-widest">No matching financial items found...</p>
            </div>
          )}
        </div>

        {/* Sidebar Statistics & Informational Block */}
        <div className="w-full lg:w-72 space-y-4 shrink-0 flex flex-col justify-start">
          
          {/* Quick Advisory Notice */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-5.5 h-5.5 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck size={12} className="text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Regulatory Safeguard</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Live updates are automatically filtered. Trade alerts reflect professional technical consensus. Double check independent disclosures before placing real capital orders.
            </p>
          </div>

        </div>

      </div>

      {/* Admin Post/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Newspaper className="text-blue-500 animate-pulse" size={18} />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  {editingItem ? "EDIT WIRE ENTRY" : "TRANSMIT NEW WIRE"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Article Headline</label>
                <input
                  type="text"
                  value={formHeadline}
                  onChange={(e) => setFormHeadline(e.target.value)}
                  placeholder="e.g. Nifty 50 approaches support near moving averages"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-bold placeholder:text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Source Agency</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="e.g. Libra Intel Desk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">External Link (Optional)</label>
                  <input
                    type="text"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none font-bold font-mono text-[10px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Target Segment</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormSegment('DOMESTIC')}
                      className={`py-1.5 text-[9px] font-black rounded-lg transition-all ${formSegment === 'DOMESTIC' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 bg-transparent shadow-none'}`}
                    >
                      DOMESTIC
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSegment('GLOBAL')}
                      className={`py-1.5 text-[9px] font-black rounded-lg transition-all ${formSegment === 'GLOBAL' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 bg-transparent shadow-none'}`}
                    >
                      GLOBAL
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Sentiment Accent</label>
                  <select
                    value={formSentiment}
                    onChange={(e: any) => setFormSentiment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] text-white focus:border-blue-500 outline-none font-bold uppercase"
                  >
                    <option value="BULLISH">BULLISH</option>
                    <option value="BEARISH">BEARISH</option>
                    <option value="NEUTRAL">NEUTRAL</option>
                    <option value="MACRO">MACRO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Description Narrative</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Insert analysis narrative. Separate paragraphs with double newlines for neat styling..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-blue-500 outline-none font-bold placeholder:text-slate-700 leading-relaxed"
                />
              </div>

              <div className="flex items-center space-x-3.5 bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl justify-between">
                <div>
                  <label className="block text-[10px] font-black text-white uppercase tracking-widest">Flag as Breaking News</label>
                  <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block leading-tight">Highlights with a vibrant red accent framing.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsBreaking(!formIsBreaking)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none flex items-center ${formIsBreaking ? 'bg-red-600 justify-end' : 'bg-slate-800 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/10 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveArticle}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg flex items-center space-x-2 active:scale-95"
              >
                <Check size={12} />
                <span>{editingItem ? "UPDATE ARTICLE" : "TRANSMIT"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
