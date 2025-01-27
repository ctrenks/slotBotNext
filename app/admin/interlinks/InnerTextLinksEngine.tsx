import { prisma } from "@/prisma";
import { JSDOM } from "jsdom";

interface Casino {
  id: number;
  casino: string | null;
  clean_name: string | null;
}

interface Software {
  id: number;
  software_name: string | null;
  link: string | null;
}

interface Game {
  game_id: number;
  game_name: string | null;
  game_clean_name: string | null;
}

interface ManualLink {
  url: string;
  text: string;
}

export class InnerTextLinksEngine {
  private text: string;
  private casinos: Casino[] = [];
  private software: Software[] = [];
  private games: Game[] = [];
  private manualLinks: ManualLink[] = [];
  private casinosPath: string;
  private softwarePath: string;
  private slotsPath: string;
  private odds: number;
  private currentUrl: string;

  constructor(text: string, currentUrl: string) {
    this.text = text;
    this.currentUrl = currentUrl;
    this.casinosPath = process.env.CASINOSPATH || "/casinos";
    this.softwarePath = process.env.SOFTWAREPATH || "/software";
    this.slotsPath = process.env.SLOTSPATH || "/slots";
    this.odds = Number(process.env.INTERLINKS_ODDS) || 3;
    
    // Parse manual links from environment variable
    try {
      this.manualLinks = process.env.MANUAL_LINKS ? 
        JSON.parse(process.env.MANUAL_LINKS) : [];
    } catch (e) {
      console.error('Error parsing MANUAL_LINKS:', e);
      this.manualLinks = [];
    }
  }

  private removeExistingLinks(): void {
    this.text = this.text.replace(/<a\b[^>]*>.*?<\/a>/gi, "");
  }

  private async fetchData(): Promise<void> {
    // Fetch casinos, software, and games in parallel
    const [casinos, software, games] = await Promise.all([
      prisma.casino_p_casinos.findMany({
        select: {
          id: true,
          casino: true,
          clean_name: true,
        },
      }),
      prisma.casino_p_software.findMany({
        select: {
          id: true,
          software_name: true,
          link: true,
        },
      }),
      prisma.casino_p_games.findMany({
        select: {
          game_id: true,
          game_name: true,
          game_clean_name: true,
        },
      }),
    ]);

    this.casinos = casinos;
    this.software = software;
    this.games = games;
  }

  private generateKeywordMap(): Map<string, string> {
    const keywordMap = new Map<string, string>();

    // Add manual links first
    this.manualLinks.forEach((link) => {
      keywordMap.set(link.text, `<a href="${link.url}">${link.text}</a>`);
    });

    // Add casino keywords
    this.casinos.forEach((casino) => {
      if (!casino.casino || !casino.clean_name) return;
      const url = `${this.casinosPath}/${casino.clean_name}`;
      const casinoKeyword = `${casino.casino} Casino`;
      keywordMap.set(casinoKeyword, `<a href="${url}">${casinoKeyword}</a>`);
      const bonusKeyword = `${casino.casino} Casino Bonus`;
      keywordMap.set(bonusKeyword, `<a href="${url}">${bonusKeyword}</a>`);
    });

    // Add software keywords
    this.software.forEach((sw) => {
      if (!sw.software_name || !sw.link) return;
      const url = `${this.softwarePath}/${sw.link}`;
      keywordMap.set(
        sw.software_name,
        `<a href="${url}">${sw.software_name}</a>`
      );
    });

    // Add game keywords
    this.games.forEach((game) => {
      if (!game.game_name || !game.game_clean_name) return;
      const url = `${this.slotsPath}/${game.game_clean_name}`;
      keywordMap.set(game.game_name, `<a href="${url}">${game.game_name}</a>`);
    });

    return keywordMap;
  }

  private replaceKeywords(keywordMap: Map<string, string>): void {
    const sortedKeywords = Array.from(keywordMap.keys()).sort(
      (a, b) => b.length - a.length
    );

    const dom = new JSDOM(this.text);
    const { document } = dom.window;

    // Track which keywords and URLs have been used
    const usedKeywords = new Set<string>();
    const usedUrls = new Set<string>([this.currentUrl]);

    const processTextNode = (node: Text) => {
      let content = node.textContent || "";
      sortedKeywords.forEach((keyword) => {
        // Skip if this keyword has already been used
        if (usedKeywords.has(keyword)) return;

        const link = keywordMap.get(keyword)!;
        // Extract URL from the link string
        const urlMatch = link.match(/href="([^"]+)"/);
        if (!urlMatch) return;
        const url = urlMatch[1];

        // Skip if this URL has already been used
        if (usedUrls.has(url)) return;

        const regex = new RegExp(`\\b${keyword}\\b`, "gi");

        // Only attempt one replacement with probability 1/odds
        let replaced = false;
        content = content.replace(regex, (match) => {
          if (replaced || Math.random() >= 1 / this.odds) {
            return match;
          }
          replaced = true;
          usedKeywords.add(keyword);
          usedUrls.add(url);
          return link;
        });
      });

      const temp = document.createElement("div");
      temp.innerHTML = content;

      const parent = node.parentNode;
      if (parent) {
        while (temp.firstChild) {
          parent.insertBefore(temp.firstChild, node);
        }
        parent.removeChild(node);
      }
    };

    // Walk through all text nodes, skipping those inside links
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          let parent = node.parentElement;
          while (parent) {
            // Skip if inside a link
            if (parent.tagName === "A") {
              return NodeFilter.FILTER_REJECT;
            }
            // Accept if inside a paragraph
            if (parent.tagName === "P") {
              return NodeFilter.FILTER_ACCEPT;
            }
            parent = parent.parentElement;
          }
          // Reject if not inside a paragraph
          return NodeFilter.FILTER_REJECT;
        },
      }
    );

    const nodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      nodes.push(node);
    }

    nodes.forEach(processTextNode);

    this.text = document.body.innerHTML;
  }

  public async process(): Promise<string> {
    this.removeExistingLinks();
    await this.fetchData();
    const keywordMap = this.generateKeywordMap();
    this.replaceKeywords(keywordMap);
    return this.text;
  }
}
