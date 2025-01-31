export interface Slot {
  name: string;
  image?: string;
  cleanName?: string;
}

export interface SlotError {
  error: string;
}

export interface Alert {
  id: string;
  message: string;
  geoTargets: string[];
  referralCodes: string[];
  startTime: Date;
  endTime: Date;
  casinoId?: number;
  casinoName?: string;
  casinoCleanName?: string;
  casinoImage?: string;
  slot?: string;
  slotImage?: string;
  customUrl?: string;
  maxPotential?: number;
  recommendedBet?: number;
  stopLimit?: number;
  targetWin?: number;
  maxWin?: number;
  rtp?: number;
  read?: boolean;
}
