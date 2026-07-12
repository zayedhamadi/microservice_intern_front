export interface StatCard {
  total: number;
  delta: number;
  thisMonth: number;
  lastMonth: number;
}

export interface StatsPayload {
  users?: {
    total: number;
    delta: number;
    thisMonth: number;
    lastMonth: number;
  };
  admins?: {
    total: number;
    delta: number;
    thisMonth: number;
    lastMonth: number;
  };
  managers?: {
    total: number;
    delta: number;
    thisMonth: number;
    lastMonth: number;
  };
  rh?: { total: number; delta: number; thisMonth: number; lastMonth: number };
  employees?: {
    total: number;
    delta: number;
    thisMonth: number;
    lastMonth: number;
  };
  inactifs?: {
    total: number;
    delta: number;
    thisMonth: number;
    lastMonth: number;
  };
  genreByRole?: Record<string, Record<string, number>>;
  statusByRole?: Record<string, Record<string, number>>;
  monthly?: Record<string, number[]>;
  inscrCess?: { inscriptions: number[]; cessations: number[] };
  last5?: any[];
}
