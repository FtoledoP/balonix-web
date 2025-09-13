import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, fromEvent } from 'rxjs';

export interface UserProfile {
  uid: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  activeTeam?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public userProfileSource = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSource.asObservable();
  
  // Observable para detectar clics en el documento
  documentClickEvent: Observable<MouseEvent> = fromEvent<MouseEvent>(document, 'click');

  setUserProfile(profile: UserProfile | null) {
    this.userProfileSource.next(profile);
  }
}
