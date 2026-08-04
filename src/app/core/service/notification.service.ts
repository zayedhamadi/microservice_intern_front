import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';


@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
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

  error(title: string, text?: string): Promise<any> {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#d33',
      confirmButtonText: 'OK',
    });
  }

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
