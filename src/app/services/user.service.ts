import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, from, fromEvent, of } from 'rxjs';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface UserProfile {
  uid: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  activeTeam?: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public userProfileSource = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSource.asObservable();
  
  // Observable para detectar clics en el documento
  documentClickEvent: Observable<MouseEvent> = fromEvent<MouseEvent>(document, 'click');

  private firebaseService?: FirebaseService;

  constructor(private injector: Injector) {}

  private getFirebaseService(): FirebaseService {
    if (!this.firebaseService) {
      this.firebaseService = this.injector.get(FirebaseService);
    }
    return this.firebaseService;
  }

  setUserProfile(profile: UserProfile | null) {
    this.userProfileSource.next(profile);
  }

  getUserById(userId: string): Observable<UserProfile | null> {
    if (!userId) {
      return of(null);
    }
    const fs = this.getFirebaseService();
    const userDocRef = doc(fs.firestore, 'users', userId);
    return from(getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    }));
  }
}
