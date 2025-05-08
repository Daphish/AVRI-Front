import { Component } from '@angular/core';
import { EventoEncuestaService } from '../../services/evento-encuesta.service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(private eventoEncuesta: EventoEncuestaService) {}

  lanzarEncuesta() {
    console.log('Evento lanzado desde header');
    this.eventoEncuesta.lanzarEncuesta();
  }
}
