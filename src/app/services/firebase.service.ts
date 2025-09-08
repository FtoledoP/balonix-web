import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';
import { UserService, UserProfile } from './user.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;

  constructor(
    private userService: UserService,
    private loadingService: LoadingService
  ) {
    this.loadingService.show();
    this.app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.handleAuthStateChange();
  }

  private handleAuthStateChange() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        if (userDoc.exists()) {
          this.userService.setUserProfile(userDoc.data() as UserProfile);
        }
        this.loadingService.hide();
      } else {
        this.userService.setUserProfile(null);
        this.loadingService.hide();
      }
    });
  }
}
