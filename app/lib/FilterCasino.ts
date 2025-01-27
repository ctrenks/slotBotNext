export interface DatabaseBonus {
  id: number;
  currency: string | null;
  multi_currency: string | null;
  bonusAmount: number | null;
  depositBonus: number | null;
  code: string | null;
  nodeposit: number | null;
  percent: number | null;
  playthrough: number | null;
  deposit: number | null;
  link: string | null;
  type: string | null;
  freespins: number | null;
  name: string | null;
  geo_values: number[];
  // Add other fields from your database schema
}

export interface CasinosWithLocation {
  id: number;
  casino: string | null;
  clean_name: string | null;
  button: string | null;
  bonuses: DatabaseBonus[];
  homepageimage?: string;
  rating?: number;
  information?: string;
  reviewUrl?: string;
  playUrl?: string;
}

// This is the type we use after processing through BonusFilter
export interface ProcessedCasino {
  id: number;
  casino: string;
  clean_name: string;
  button: string;
  currency: string;
  ndAmount: number | null | undefined;
  ndCurrency: string;
  ndBonusType: string | undefined;
  bonusAmount: number | null | undefined;
  ndBonusCode: string | undefined;
  depositBonusCode: string | undefined;
  reviewUrl?: string;
  playUrl?: string;
  playthrough: number | undefined;
  wagerVal: string | undefined;
  depositAmount: number | undefined;
  bonusPercent: number | undefined;
  rating?: number;
  information?: string;
}
