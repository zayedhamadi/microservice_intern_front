import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApplicationDto } from '../../../core/models/Application';
import { CertificationDTO } from '../../../core/models/CertificationDTO';
import { PageResponse } from '../../../core/models/PageResponse';
import { UserProfile } from '../../../core/models/UserProfile';
import { ApplyService } from '../../../core/service/apply.service';
import { CertificationService } from '../../../core/service/certification.service';
import { UserService } from '../../../core/service/user.service';
import { Location } from '@angular/common';


type Tab = 'profil' | 'candidatures' | 'certifications';

@Component({
  selector: 'app-consulter-profil-user-details-per-rh',
  templateUrl: './consulter-profil-user-details-per-rh.component.html',
  styleUrl: './consulter-profil-user-details-per-rh.component.css',
})
export class ConsulterProfilUserDetailsPerRHComponent implements OnInit {
  get avatarSrc(): string | null {
    if (!this.user?.imageBase64) return null;
    return this.user.imageBase64.startsWith('data:')
      ? this.user.imageBase64
      : `data:image/jpeg;base64,${this.user.imageBase64}`;
  }
  downloadCertif(certif: CertificationDTO): void {
    if (!certif.pdfBase64) return;
    const href = certif.pdfBase64.startsWith('data:')
      ? certif.pdfBase64
      : `data:application/pdf;base64,${certif.pdfBase64}`;
    const link = document.createElement('a');
    link.href = href;
    link.download = `${certif.titre}.pdf`;
    link.click();
  }
  keycloakId!: string;
  activeTab: Tab = 'profil';

  user?: UserProfile;
  loadingUser = false;
  userError = false;

  candidatures: ApplicationDto[] = [];
  candPage = 0;
  candSize = 5;
  candTotalPages = 0;
  candTotalElements = 0;
  statutFilter = '';
  loadingCandidatures = false;

  statutOptions = [
    'EN_ATTENTE',
    'EN_ENTRETIEN_RH',
    'EN_ENTRETIEN_TECHNIQUE',
    'EN_ENTRETIEN_FINAL',
    'ACCEPTE',
    'REFUSE',
    'RETIRE',
  ];

  certifications: CertificationDTO[] = [];
  certifPage = 0;
  certifSize = 6;
  certifTotalPages = 0;
  certifTotalElements = 0;
  titreFilter = '';
  private titreFilter$ = new Subject<string>();
  loadingCertifications = false;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private userService: UserService,
    private applyService: ApplyService,
    private certificationService: CertificationService,
  ) {}
  goBack(): void {
    this.location.back();
  }
  ngOnInit(): void {
    this.keycloakId = this.route.snapshot.paramMap.get('id')!;
    this.loadUser();
    this.loadCandidatures();
    this.loadCertifications();

    this.titreFilter$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.certifPage = 0;
        this.loadCertifications();
      });
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  loadUser(): void {
    this.loadingUser = true;
    this.userError = false;
    this.userService.getUserProfilForRH(this.keycloakId).subscribe({
      next: (u) => (this.user = u),
      error: () => (this.userError = true),
      complete: () => (this.loadingUser = false),
    });
  }

  loadCandidatures(): void {
    this.loadingCandidatures = true;
    this.applyService
      .getCandidaturesParCandidat(
        this.keycloakId,
        this.candPage,
        this.candSize,
        'dateCandidature',
        'desc',
        this.statutFilter || undefined,
      )
      .subscribe({
        next: (res: PageResponse<ApplicationDto>) => {
          this.candidatures = res.content;
          this.candTotalPages = res.totalPages;
          this.candTotalElements = res.totalElements;
        },
        complete: () => (this.loadingCandidatures = false),
      });
  }

  onStatutChange(): void {
    this.candPage = 0;
    this.loadCandidatures();
  }

  goToCandPage(p: number): void {
    if (p < 0 || p >= this.candTotalPages) return;
    this.candPage = p;
    this.loadCandidatures();
  }

  loadCertifications(): void {
    this.loadingCertifications = true;
    this.certificationService
      .getCertificationsPaged(
        this.keycloakId,
        this.certifPage,
        this.certifSize,
        'dateCertif',
        'desc',
        this.titreFilter || undefined,
      )
      .subscribe({
        next: (res: PageResponse<CertificationDTO>) => {
          this.certifications = res.content;
          this.certifTotalPages = res.totalPages;
          this.certifTotalElements = res.totalElements;
        },
        complete: () => (this.loadingCertifications = false),
      });
  }

  onTitreInput(value: string): void {
    this.titreFilter = value;
    this.titreFilter$.next(value);
  }

  goToCertifPage(p: number): void {
    if (p < 0 || p >= this.certifTotalPages) return;
    this.certifPage = p;
    this.loadCertifications();
  }

  pagesArray(total: number): number[] {
    return Array.from({ length: total }, (_, i) => i);
  }
}