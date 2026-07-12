export interface StatCard {
  total: number;
  delta: number;
  thisMonth: number;
  lastMonth: number;
}


export interface StatsPayload {
  users?: StatCard;
  rh?: StatCard;
  employees?: StatCard;
  candidats?: StatCard;
  inactifs?: StatCard;
  genreByRole?: Record<string, Record<string, number>>;
  statusByRole?: Record<string, Record<string, number>>;
  monthly?: Record<string, number[]>; 
  inscrCess?: { inscriptions: number[]; cessations: number[] };
  last5?: any[];
}
interface ActivityItem {
  type: string;
  message: string;
  role: string | null;
  actorPrenom: string | null;
  actorNom: string | null;
  motif: string | null;
  createdAt: string;
}

interface RecentUser {
  id: number;
  matricule: string;
  cin: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  etatCompte: string;
  dateInscrit: string;
  image: string | null;
  imageLoading: boolean;
}

interface RoleDistribution {
  label: string;
  role: string;
  pct: number;
  color: string;
}

interface ActivityDisplay {
  text: string;
  time: string;
  color: string;
}

interface DepartmentStat {
  id: number;
  nom: string;
  total: number;
}

interface PosteStat {
  id: number;
  nom: string;
  departementNom: string;
  total: number;
}

interface StructureUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  departement: string;
  poste: string;
  etatCompte: string;
  status: string;
  dateInscrit: string;
}

interface SelectItem {
  id: number;
  nom: string;
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
