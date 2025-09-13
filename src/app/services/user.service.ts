import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
  private userProfileSource = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSource.asObservable();

  setUserProfile(profile: UserProfile | null) {
    this.userProfileSource.next(profile);
  }
}
