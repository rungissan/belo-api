import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { RequestBase } from '../services/request-base';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UserService extends RequestBase {
  constructor(public http: HttpClient) {
    super(http);
  }

  logout(): Observable<string> {
    return this.http.get(`${environment.API_BASE_URL}/logout`, {...this.optionsNoPre, responseType: 'text'});
  }
}
