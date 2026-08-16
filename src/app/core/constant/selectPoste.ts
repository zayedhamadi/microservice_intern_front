import { ApplicationStatus } from "../models/enums/enumPosteRecrutemnt";
import { Interview } from "../models/interview";

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


export const STATUS_COLORS: Record<string, string> = {
  PLANIFIE: '#3b82f6',
  CONFIRME: '#10b981',
  EN_COURS: '#f59e0b',
  TERMINE: '#6b7280',
  ANNULE: '#ef4444',
  REPORTE: '#8b5cf6',
}as const;


export const STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  CONFIRME: 'Confirmé',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  REPORTE: 'Reporté',
} as const ;

export interface HolidayInfo {
  date: string; // 'YYYY-MM-DD'
  label: string;
  type: 'national' | 'religious';
};

export interface MiniDay {
  date: Date;
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
};

export interface AgendaGroup {
  iso: string;
  dayNumber: string;
  weekday: string;
  monthYear: string;
  isToday: boolean;
  items: Interview[];
};

// Dates 2026 — fêtes nationales fixes + fêtes religieuses ESTIMÉES
// (calendrier lunaire hégirien, confirmation officielle par le Mufti de la
// République la veille de chaque fête — à ajuster de ±1 jour si besoin)
export const TUNISIA_HOLIDAYS_2026: HolidayInfo[] = [
  { date: '2026-01-01', label: "Jour de l'An", type: 'national' },
  { date: '2026-01-14', label: 'Fête de la Révolution et de la Jeunesse', type: 'national' },
  { date: '2026-03-20', label: "Fête de l'Indépendance", type: 'national' },
  { date: '2026-03-20', label: 'Aïd el-Fitr (1er jour) — estimé', type: 'religious' },
  { date: '2026-03-21', label: 'Aïd el-Fitr (2e jour) — estimé', type: 'religious' },
  { date: '2026-03-22', label: 'Aïd el-Fitr (3e jour, admin.) — estimé', type: 'religious' },
  { date: '2026-04-09', label: 'Journée des Martyrs', type: 'national' },
  { date: '2026-05-01', label: 'Fête du Travail', type: 'national' },
  { date: '2026-05-26', label: 'Aïd el-Adha (1er jour) — estimé', type: 'religious' },
  { date: '2026-05-27', label: 'Aïd el-Adha (2e jour) — estimé', type: 'religious' },
  { date: '2026-06-15', label: 'Nouvel An musulman (Ras El Am El Hijri) — estimé', type: 'religious' },
  { date: '2026-07-25', label: 'Fête de la République', type: 'national' },
  { date: '2026-08-13', label: 'Fête de la Femme', type: 'national' },
  { date: '2026-08-24', label: 'Mouled (Anniversaire du Prophète) — estimé', type: 'religious' },
  { date: '2026-10-15', label: "Fête de l'Évacuation", type: 'national' },
]as const;

export const RAMADAN_2026 = { start: '2026-02-18', end: '2026-03-19' } as const;