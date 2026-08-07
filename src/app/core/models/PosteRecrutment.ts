import {
  StatusPosteRecrutement,
  TypeContrat,
  WorkType,
} from './enums/enumPosteRecrutemnt';

export interface PosteRecrutment {
  idPosteRecrutement?: string;

  recruteurKeycloakId?: string;

  titre?: string;
  description?: string;
  profilDemandeOfPoste?: string;

  competencesRequises?: string[];
  languesRequises?: string[];

  anneesExperienceMin?: number;
  niveauEtudeRequis?: string;

  typeContrat?: TypeContrat;
  status?: StatusPosteRecrutement;
  workType?: WorkType;

  lieu?: string;
  salaire?: number;
  nombrePostes?: number;

  departementNom?: string;

  datePosteRecrutement?: string;
  dateExpirationPosteRecrutement?: string;
}
