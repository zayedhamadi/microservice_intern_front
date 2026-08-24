import { Interview } from "../interview";

/**
 * Statuts pour lesquels un créneau doit être considéré comme "occupé".
 * Un entretien ANNULE/TERMINE/ABSENT ne bloque plus le créneau.
 */
const STATUTS_BLOQUANTS = new Set([
  'PLANIFIE',
  'CONFIRME',
  'EN_COURS',
  'REPORTE',
]);

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export interface ConflictCandidate {
  interviewerName: string;
  interviewDate: string; // 'yyyy-MM-dd'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
}

/**
 * Détection client-side de chevauchement de créneaux pour un même recruteur/intervenant.
 *
 * NOTE : le service Angular fourni (`interview.service.ts`) expose déjà `checkAvailability()`
 * qui appelle `GET /interviews/availability`, mais cet endpoint n'existe pas encore côté
 * `InterviewController`. En attendant un vrai contrôle serveur (souhaitable pour une garantie
 * atomique comme celle déjà en place sur `activeSlotKey`), cette fonction fait un contrôle
 * "best effort" à partir de la liste d'entretiens déjà chargée côté front.
 */
export function findConflicts(
  interviews: Interview[],
  candidat: ConflictCandidate,
  excludeId?: string,
): Interview[] {
  if (
    !candidat.interviewerName ||
    !candidat.interviewDate ||
    !candidat.startTime ||
    !candidat.endTime
  ) {
    return [];
  }

  const newStart = toMinutes(candidat.startTime);
  const newEnd = toMinutes(candidat.endTime);

  return interviews.filter((i) => {
    if (excludeId && i.id === excludeId) return false;
    if (!STATUTS_BLOQUANTS.has(i.status)) return false;
    if (!i.interviewerName || !i.interviewDate || !i.startTime || !i.endTime)
      return false;
    if (
      i.interviewerName.trim().toLowerCase() !==
      candidat.interviewerName.trim().toLowerCase()
    )
      return false;
    if (i.interviewDate !== candidat.interviewDate) return false;

    const s = toMinutes(i.startTime);
    const e = toMinutes(i.endTime);
    return newStart < e && s < newEnd; // chevauchement de plages [start,end)
  });
}
