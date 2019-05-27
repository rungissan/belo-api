import { Title } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { environment } from 'src/environments/environment';


@Injectable()
export class TitleService {
  constructor(
     private title: Title
  ) {}

  setTitle(
    snapshot: ActivatedRouteSnapshot,
  ) {
    let lastChild = snapshot;
    while (lastChild.children.length) {
      lastChild = lastChild.children[0];
    }
    const { title } = lastChild.data;
    if (title) {
      this.title.setTitle(`${title} - ${environment.appName}`);
    } else {
      this.title.setTitle(environment.appName);
    }
  }
}
