export interface MonthDataDto {
  mois: number;
  total: number;
}

export interface EvolutionDto {
  total: number;
  ceMois: number;
  moisDernier: number;
  variationPourcent: number;
}

export interface ApplicationStatsDto {
  total: number;
  parStatut: Record<string, number>;
  evolution: EvolutionDto;
  tauxAcceptation: number;
  tauxRejet: number;
  serieMensuelle: MonthDataDto[];
}

export interface InterviewsStatsDto {
  total: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
  aVenir: number;
  dansLes7Jours: number;
  tauxReussite: number;
  serieMensuelle: MonthDataDto[];
}

export interface PostesStatsDto {
  total: number;
  ouverts: number;
  parStatut: Record<string, number>;
  parDepartement: Record<string, number>;
  expirantSous7Jours: number;
  evolution: EvolutionDto;
  serieMensuelle: MonthDataDto[];
}

export interface ReprogrammerStatsDto {
  total: number;
  enAttente: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
  serieMensuelle: MonthDataDto[];
}

export interface DashboardStatsDto {
  applications: ApplicationStatsDto;
  interviews: InterviewsStatsDto;
  postes: PostesStatsDto;
  reprogrammations: ReprogrammerStatsDto;
  genereLe: string;
}
