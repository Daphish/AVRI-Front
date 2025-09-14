import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core'; // Agregado OnInit
import {
  Document,
  RepositoryDocument,
} from '../../interfaces/document.interface';
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
  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  /* ---------- método para mostrar toast ---------- */
  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  // Implementado OnInit
  recommendedDocs: RepositoryDocument[] = [
    {
      id: 'rec-doc-0', // CORREGIDO: id como string
      title:
        'Efectos de la quema de la caña de azúcar en las propiedades del suelo en Tancanhuitz San Luis Potosí',
      repository_uri: 'uri/doc0',
      repository_id: 'repo-id-0', // AÑADIDO: repository_id
      status: 'L',
      author: 'Rojas Velázquez, Montserrath',
      type: 'Tesis',
      publication_date: '2023-01-01',
      knowledge_area: 'Ciencias Agrícolas',
      license: 'CC BY-NC-SA 4.0',
    },
    {
      id: 'rec-doc-1', // CORREGIDO: id como string
      title:
        'Manual de enfermería para el manejo del equipo laparoscópico de cirugía general en la Central de Esterilización y Equipos',
      repository_uri: 'uri/doc1',
      repository_id: 'repo-id-1', // AÑADIDO: repository_id
      status: 'L',
      author: 'Almazán Segovia, Iliana Guadalupe',
      type: 'Tesis',
      publication_date: '2024-05-04',
      knowledge_area: 'Medicina',
      license: 'CC BY-NC-SA 4.0',
    },
    {
      id: 'rec-doc-2', // CORREGIDO: id como string (ID único)
      title:
        'Identificación de patrones metabolómicos en orina en pacientes con cáncer de mama posterior al tratamiento', // Título único
      repository_uri: 'uri/doc2',
      repository_id: 'repo-id-2', // AÑADIDO: repository_id
      status: 'L',
      author: 'Rodríguez Govea, Edson Artemio',
      type: 'Tesis',
      publication_date: '2021-05-10',
      knowledge_area: 'Medicina',
      license: 'CC BY-NC-SA 4.0',
    },
    {
      id: 'rec-doc-3', // CORREGIDO: id como string (ID único)
      title:
        'Diagnóstico y recomendaciones para la conservación de la colección de carteles y fotomontajes de la cineteca alameda del estado de San Luis Potosí', // Título único
      repository_uri: 'uri/doc3',
      repository_id: 'repo-id-3', // AÑADIDO: repository_id
      status: 'L',
      author: 'Rodríguez Contreras, Daniela',
      type: 'Tesis',
      publication_date: '2020-01-01',
      knowledge_area: 'Ciencias sociales',
      license: 'CC BY-NC-SA 4.0',
    },
  ];

  recommendedDocsBack: DocumentDetail[] = [];

  constructor(private recommendationService: RecommendationService) {}

  isLoadingRecommendations = false;
  hasError = false;
  errorMessage = '';

  // ngOninit -> debe ser ngOnInit (camelCase)
  ngOnInit(): void {
    this.loadRecommendations();
  }
  
  private loadRecommendations(): void {
    this.isLoadingRecommendations = true;
    this.hasError = false;
    this.errorMessage = '';

    try {
      this.recommendationService.getDetailedDocuments();
    } catch (error) {
      console.error('Error al solicitar documentos:', error);
      this.hasError = true;
      this.errorMessage = 'Error al solicitar documentos.';
      this.showToastMessage('Error al solicitar documentos.');
      this.isLoadingRecommendations = false;
      return;
    }

    this.recommendationService.documents$.subscribe({
      next: (documents) => {
        this.isLoadingRecommendations = false;
        if (documents && documents.length > 0) {
          this.recommendedDocsBack = documents;
          this.hasError = false;
        } else {
          console.log('No se recibieron documentos recomendados.');
          this.hasError = true;
          this.errorMessage = 'No hay documentos recomendados disponibles.';
          this.showToastMessage('No se encontraron documentos recomendados.', 'warning');
        }
      },
      error: (error) => {
        console.error('Error al obtener documentos:', error);
        this.isLoadingRecommendations = false;
        this.hasError = true;
        this.errorMessage = 'Error al cargar documentos recomendados.';
        this.showToastMessage('Error al cargar documentos recomendados.');
      }
    });
  }

   retryLoadRecommendations(): void {
    this.loadRecommendations();
  }
    
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
