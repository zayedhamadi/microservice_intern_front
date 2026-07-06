import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

/**
 * Point d'entrée unique pour toutes les notifications SweetAlert2 de l'app.
 * Objectif : ne jamais appeler Swal.fire(...) directement dans un composant,
 * pour garder un style et un comportement cohérents partout (et pouvoir
 * changer de lib de notification un jour sans toucher à 30 fichiers).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  /** Petite notification discrète en haut à droite, disparaît seule. */
  toast(icon: SweetAlertIcon, title: string, timer = 2500): void {
    this.toastMixin.fire({ icon, title, timer });
  }

  toastSuccess(title: string): void {
    this.toast('success', title);
  }

  toastError(title: string): void {
    this.toast('error', title, 3500);
  }

  /** Alerte centrale bloquante, pour les erreurs importantes. */
  error(title: string, text?: string): Promise<any> {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#d33',
      confirmButtonText: 'OK',
    });
  }

  /** Alerte centrale de succès, avec action optionnelle au clic sur OK. */
  success(title: string, text?: string): Promise<any> {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK',
    });
  }

  warning(
    title: string,
    text?: string,
    confirmButtonText = 'OK',
  ): Promise<any> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText,
    });
  }

  /** Boîte de confirmation Oui/Non, retourne true si confirmé. */
  async confirm(
    title: string,
    text?: string,
    confirmButtonText = 'Confirmer',
  ): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText,
      cancelButtonText: 'Annuler',
    });
    return result.isConfirmed;
  }
}
