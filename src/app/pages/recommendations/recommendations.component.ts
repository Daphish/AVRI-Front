import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core'; // Agregado OnInit
import { Document } from '../../interfaces/document.interface';
import { RecommendationService } from '../../services/recommendation.service';
import { DocumentDetail } from '../../services/document.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css',
})
export class RecommendationsComponent implements OnInit {
  // Implementado OnInit
  recommendedDocs: Document[] = [
    {
      id: 'rec-doc-0', // CORREGIDO: id como string
      title: 'Primer documento recomendado',
      repository_uri: 'uri/doc0',
      repository_id: 'repo-id-0', // AÑADIDO: repository_id
      status: 'L',
    },
    {
      id: 'rec-doc-1', // CORREGIDO: id como string
      title: 'Segundo documento recomendado',
      repository_uri: 'uri/doc1',
      repository_id: 'repo-id-1', // AÑADIDO: repository_id
      status: 'R',
    },
    {
      id: 'rec-doc-2', // CORREGIDO: id como string (ID único)
      title: 'Tercer documento', // Título único
      repository_uri: 'uri/doc2',
      repository_id: 'repo-id-2', // AÑADIDO: repository_id
      status: 'E',
    },
    {
      id: 'rec-doc-3', // CORREGIDO: id como string (ID único)
      title: 'Cuarto documento', // Título único
      repository_uri: 'uri/doc3',
      repository_id: 'repo-id-3', // AÑADIDO: repository_id
      status: 'L',
    },
  ];

  recommendedDocsBack: DocumentDetail[] = [];

  constructor(private recommendationService: RecommendationService) {}

  // ngOninit -> debe ser ngOnInit (camelCase)
  ngOnInit(): void {
    this.recommendationService.getDetailedDocuments();
    this.recommendationService.documents$.subscribe((documents) => {
      if (documents && documents.length > 0) {
        this.recommendedDocsBack = documents;
      } else {
        // Opcional: Mantener los datos de ejemplo o mostrar mensaje si no hay recomendaciones
        console.log('No se recibieron documentos recomendados del servicio.');
      }
    });
    // CORREGIDO: nombre del método y tipo de retorno
    // Descomenta y ajusta esto si es necesario
    /*
    this.recommendationService.getDocuments().subscribe(documents => {
      if (documents && documents.length > 0) {
        this.recommendedDocs = documents;
      } else {
        // Opcional: Mantener los datos de ejemplo o mostrar mensaje si no hay recomendaciones
        console.log('No se recibieron documentos recomendados del servicio.');
      }
    });
    */
  }
}
