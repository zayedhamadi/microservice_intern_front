import { ApplicationStatus } from "../models/enums/enumPosteRecrutemnt";

export const LABELS_STATUT: Record<ApplicationStatus, string> = {
  [ApplicationStatus.EN_ATTENTE]: 'En attente',
  [ApplicationStatus.SELECTIONNE]: 'Sélectionné',
  [ApplicationStatus.EN_ENTRETIEN_RH]: 'Entretien RH',
  [ApplicationStatus.EN_ENTRETIEN_TECHNIQUE]: 'Entretien technique',
  [ApplicationStatus.EN_ENTRETIEN_FINAL]: 'Entretien final',
  [ApplicationStatus.ACCEPTE]: 'Accepté',
  [ApplicationStatus.REJETE]: 'Refusé',
  [ApplicationStatus.RETIRE]: 'Retiré par le candidat',
}as const;

export const TRANSITIONS_POSSIBLES: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.EN_ATTENTE]: [
        ApplicationStatus.SELECTIONNE,
        ApplicationStatus.REJETE,
    ],
    [ApplicationStatus.SELECTIONNE]: [
        ApplicationStatus.EN_ENTRETIEN_RH,
        ApplicationStatus.REJETE,
    ],
    [ApplicationStatus.EN_ENTRETIEN_RH]: [
        ApplicationStatus.EN_ENTRETIEN_TECHNIQUE,
        ApplicationStatus.REJETE,
    ],
    [ApplicationStatus.EN_ENTRETIEN_TECHNIQUE]: [
        ApplicationStatus.EN_ENTRETIEN_FINAL,
        ApplicationStatus.REJETE,
    ],
    [ApplicationStatus.EN_ENTRETIEN_FINAL]: [
        ApplicationStatus.ACCEPTE,
        ApplicationStatus.REJETE,
    ],
    [ApplicationStatus.ACCEPTE]: [],
    [ApplicationStatus.REJETE]: [],
    [ApplicationStatus.RETIRE]: [],
} as const;