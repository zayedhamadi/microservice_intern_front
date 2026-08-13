import {
  StatusPosteRecrutement,
  TypeContrat,
  WorkType,
} from './enums/enumPosteRecrutemnt';

export interface PosteAvecCandidatures {
  idPosteRecrutement: string;
  titre: string;
  departementNom: string;
  typeContrat: TypeContrat;
  workType: WorkType;
  status: StatusPosteRecrutement;
  lieu: string;
  salaire?: number;
  nombrePostes?: number;

  datePosteRecrutement?: string;
  dateExpirationPosteRecrutement?: string;

  nombreCandidatures: number;
  nombreEnAttente: number;
  nombreEnEntretienRH: number;
  nombreEnEntretienTechnique: number;
  nombreAcceptees: number;
  nombreRefusees: number;

  competencesRequises?: string[];
}

export interface FiltrePostesAvecCandidatures {
  departementNom?: string;
  status?: string;
  typeContrat?: string;
  workType?: string;
  search?: string;
  avecCandidatsUniquement?: boolean;
  sortBy?: 'date' | 'candidatures' | 'titre';
  sortDir?: 'asc' | 'desc';
}
