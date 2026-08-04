export enum TypeContrat {
  CDI = 'CDI',
  CDD = 'CDD',
  FREELANCE = 'FREELANCE',
  ALTERNANCE = 'ALTERNANCE',
  CIVP = 'CIVP',
  STAGE = 'STAGE',
}

export enum WorkType {
  SUR_SITE = 'SUR_SITE',
  HYBRIDE = 'HYBRIDE',
  DISTANCE = 'DISTANCE',
}

export enum StatusPosteRecrutement {
  OUVERT = 'OUVERT',
  EXPIRE = 'EXPIRE',
  FERME = 'FERME',
}

export enum InterviewType {
  RH = 'RH',
  TECHNIQUE = 'TECHNIQUE',
}
export enum InterviewResult {
  REUSSI = 'REUSSI',
  ECHOUE = 'ECHOUE',
}
export enum InterviewStatus {
  PLANIFIE = 'PLANIFIE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  REPLANIFIE = 'REPLANIFIE',
  ABSENT = 'ABSENT',
}
export enum EtatEntretien {
  RH_ENTRETIEN = 'RH_ENTRETIEN',
  TECHNIQUE_ENTRETIEN = 'TECHNIQUE_ENTRETIEN',
  ACCEPTE = 'ACCEPTE',
  REFUSE_PAR_RH = 'REFUSE_PAR_RH',
  REFUSE_PAR_TECHNIQUE = 'REFUSE_PAR_TECHNIQUE',
}
export enum CvChoice {
  EXISTANT = 'EXISTANT',
  NOUVEAU = 'NOUVEAU',
}
export enum ApplicationStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  SELECTIONNE = 'SELECTIONNE',
  ENTRETIEN_PLANIFIE = 'ENTRETIEN_PLANIFIE',
  ACCEPTE = 'ACCEPTE',
  REJETE = 'REJETE',
  RETIRE = 'RETIRE',
}