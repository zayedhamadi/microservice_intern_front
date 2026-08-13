import { Component, OnInit } from '@angular/core';
import { RankCandidatWithPostService } from '../../../core/service/rank-candidat-with-post.service';
import { PosteClasseDto } from '../../../core/models/PosteClasse';

@Component({
  selector: 'app-postes-recommandes',
  templateUrl: './postes-recommandes.component.html',
  styleUrl: './postes-recommandes.component.css',
})
export class PostesRecommandesComponent implements OnInit {
  postes: PosteClasseDto[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private readonly rankService: RankCandidatWithPostService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.rankService.getPostesRecommandes().subscribe({
      next: (postes) => {
        this.postes = postes;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger tes recommandations pour le moment.';
        this.isLoading = false;
      },
    });
  }

  labelScore(score: number): string {
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Bon match';
    if (score >= 40) return 'Match moyen';
    return 'Match faible';
  }
}