import { NgClass, NgFor, NgIf} from '@angular/common';
import { Component } from '@angular/core';
import { Document } from '../../interfaces/document.interface';
import { RecommendationService } from '../../services/recommendation.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css'
})
export class RecommendationsComponent {
  recommendedDocs: Document[] = [
    {
      id: 0,
      title: 'Primer documento',
      repository_uri: 'blablabla',
      status: 'L',
    },
    {
      id: 1,
      title: 'Segundo documento',
      repository_uri: 'blablabla',
      status: 'R',
    },
    {
      id: 0,
      title: 'Primer documento',
      repository_uri: 'blablabla',
      status: 'E',
    },
    {
      id: 1,
      title: 'Segundo documento',
      repository_uri: 'blablabla',
      status: 'L',
    },
  ]

  constructor(private recommendationService: RecommendationService) {}

  ngOninit() {
    /* this.recommendationService.getDocuments().subscribe(documents => {
      this.recommendedDocs = documents;
    }); */
  }
}
