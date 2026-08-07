import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { StatusPosteRecrutement, WorkType } from '../../core/models/enums/enumPosteRecrutemnt';
import { PosteRecrutment } from '../../core/models/PosteRecrutment';
import { PosteRecutementService } from '../../core/service/poste-recutement.service';


@Component({
  selector: 'app-consulterspecificposteseloncandidatandadmin',
  templateUrl: './consulterspecificposteseloncandidatandadmin.component.html',
  styleUrl: './consulterspecificposteseloncandidatandadmin.component.css',
})
export class ConsulterspecificposteseloncandidatandadminComponent implements OnInit {
  poste: PosteRecrutment | null = null;
  posteId = '';

  isLoading = true;
  hasError = false;
  isDeleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private posteRecrutementService: PosteRecutementService,
  ) {}

  ngOnInit(): void {
    this.posteId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.posteId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.loadPoste();
  }

  loadPoste(): void {
    this.isLoading = true;
    this.hasError = false;

    this.posteRecrutementService.getPosteById(this.posteId).subscribe({
      next: (data: PosteRecrutment) => {
        this.poste = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement poste :', err);
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  getStatusBadgeClass(status?: StatusPosteRecrutement): string {
    switch (status) {
      case StatusPosteRecrutement.OUVERT:
        return 'badge-status ouvert';
      case StatusPosteRecrutement.EXPIRE:
        return 'badge-status expire';
      case StatusPosteRecrutement.FERME:
        return 'badge-status ferme';
      default:
        return 'badge-status';
    }
  }

  getWorkTypeIcon(workType?: WorkType): string {
    switch (workType) {
      case WorkType.SUR_SITE:
        return 'fa-building';
      case WorkType.HYBRIDE:
        return 'fa-shuffle';
      case WorkType.DISTANCE:
        return 'fa-house-laptop';
      default:
        return 'fa-briefcase';
    }
  }

  getDeptInitial(nom?: string): string {
    return nom?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  }

  isExpiringSoon(): boolean {
    if (!this.poste?.dateExpirationPosteRecrutement) return false;
    const diffDays =
      (new Date(this.poste.dateExpirationPosteRecrutement).getTime() -
        Date.now()) /
      (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 5;
  }

  isExpired(): boolean {
    if (!this.poste?.dateExpirationPosteRecrutement) return false;
    return (
      new Date(this.poste.dateExpirationPosteRecrutement).getTime() < Date.now()
    );
  }

  daysAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diffDays = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays <= 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  }
}
