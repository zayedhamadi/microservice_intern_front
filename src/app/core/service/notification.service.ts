import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly brandColor = '#2563EB';
  private readonly dangerColor = '#DC2626';
  private readonly neutralColor = '#94A3B8';

  private readonly toastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (el) => {
      el.addEventListener('mouseenter', Swal.stopTimer);
      el.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  private readonly dialogMixin = Swal.mixin({
    buttonsStyling: true,
    confirmButtonColor: this.brandColor,
    cancelButtonColor: this.neutralColor,
    reverseButtons: true,
  });

  toast(icon: SweetAlertIcon, title: string, timer = 2500): void {
    this.toastMixin.fire({ icon, title, timer });
  }

  toastSuccess(title: string): void {
    this.toast('success', title);
  }

  toastError(title: string): void {
    this.toast('error', title, 3500);
  }

  toastWarning(title: string): void {
    this.toast('warning', title, 3000);
  }

  toastInfo(title: string): void {
    this.toast('info', title);
  }

  error(title: string, text?: string): Promise<any> {
    return this.dialogMixin.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: this.dangerColor,
      confirmButtonText: 'Compris',
    });
  }

  success(title: string, text?: string): Promise<any> {
    return this.dialogMixin.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'Continuer',
    });
  }

  warning(
    title: string,
    text?: string,
    confirmButtonText = 'OK',
  ): Promise<any> {
    return this.dialogMixin.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonText,
    });
  }

  async confirm(
    title: string,
    text?: string,
    confirmButtonText = 'Confirmer',
  ): Promise<boolean> {
    const result = await this.dialogMixin.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Annuler',
    });
    return result.isConfirmed;
  }

  formInvalid(message = 'Veuillez corriger les erreurs du formulaire'): void {
    this.toastError(message);
  }

  connectionError(message = 'Impossible de contacter le serveur'): void {
    this.toastError(message);
  }
}
