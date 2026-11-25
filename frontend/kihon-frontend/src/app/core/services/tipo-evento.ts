import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TipoEventoResponse } from '../../models/tipo-evento-response';

@Injectable({
  providedIn: 'root'
})
export class TipoEventoService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/tipos-evento`;

  listar(): Observable<TipoEventoResponse[]> {
    return this.http.get<TipoEventoResponse[]>(
      this.apiUrl
    );
  }
}