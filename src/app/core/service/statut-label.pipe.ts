import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_ENTRETIEN_RH: 'Entretien RH',
  EN_ENTRETIEN_TECHNIQUE: 'Entretien technique',
  EN_ENTRETIEN_FINAL: 'Entretien final',
  ACCEPTE: 'Acceptée',
  REFUSE: 'Refusée',
  RETIRE: 'Retirée',
};

@Pipe({ name: 'statutLabel' })
export class StatutLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return LABELS[value] ?? value;
  }
}
