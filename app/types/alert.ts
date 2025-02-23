export interface AlertWithRead {
  id: string;
  message: string;
  geoTargets: string[];
  referralCodes: string[];
  startTime: Date | string;
  endTime: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  casinoId: number | null;
  casinoName: string | null;
  casinoCleanName: string | null;
  slot: string | null;
  slotImage: string | null;
  customUrl: string | null;
  maxPotential: number | null;
  recommendedBet: number | null;
  stopLimit: number | null;
  targetWin: number | null;
  maxWin: number | null;
  rtp: number | null;
  read: boolean;
  casino: {
    id: number;
    url: string;
    button: string;
  } | null;
  casinoImage: string | null;
}
