
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FrecuenciaGrupoResponse } from '../../models/frecuencia-grupo-response';

@Injectable({
  providedIn: 'root'
})
export class FrecuenciaGrupoService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/frecuencias-grupo`;

  listar(): Observable<FrecuenciaGrupoResponse[]> {
    return this.http.get<FrecuenciaGrupoResponse[]>(this.apiUrl);
  }
}
