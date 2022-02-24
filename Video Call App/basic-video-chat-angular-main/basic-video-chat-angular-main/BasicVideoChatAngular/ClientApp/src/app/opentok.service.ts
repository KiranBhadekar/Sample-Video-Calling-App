import { Injectable } from '@angular/core';

import * as OT from '@opentok/client';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StateService } from './stateService';
import config from 'src/config';

@Injectable({
  providedIn: 'root',
})
export class OpentokService {

  session: OT.Session;
  token: string;

  constructor(public http: HttpClient, private config: StateService, private router: Router) {
  }

  getOT() {
    return OT;
  }

  initSession() {
    if (this.config.apiKey$ && this.config.token$ && this.config.sessionId$) {
      this.session = this.getOT().initSession(this.config.apiKey$, this.config.sessionId$);
      this.token = this.config.token$;
      return Promise.resolve(this.session);
    } else {
      return fetch(config.SAMPLE_SERVER_BASE_URL + '/session/getSession')
        .then((data) => data.json())
        .then((json) => {
          this.session = this.getOT().initSession(json.apiKey, json.sessionId);
          this.token = json.token;
          return this.session;
        });
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.session.connect(this.token, (err) => {
        if (err) {
          reject(err);
          if (err.name === "OT_NOT_CONNECTED") {
            alert("You are not connected to the internet or your connection is poor. Please Check your network connection.");
          }
          this.router.navigate(['layout/video-room']);
        } else {
          resolve(this.session);
        }
      });
    });
  }


  endSession() {
    this.session.disconnect();
  }


}
