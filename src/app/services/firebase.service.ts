import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';
import { UserService, UserProfile } from './user.service';
import { LoadingService } from './loading.service';
import { TeamService } from './team.service';

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
    private loadingService: LoadingService,
    private teamService: TeamService
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
        try {
          const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userProfile = { uid: user.uid, ...userDoc.data() } as UserProfile;
            this.userService.setUserProfile(userProfile);
            // Load teams and set active team in one go
            await this.teamService.loadUserTeamsAndSetActive(userProfile.uid, userProfile.activeTeam);
          }
        } catch (error) {
          console.error("Error during auth state change:", error);
          this.userService.setUserProfile(null);
        } finally {
          this.loadingService.hide();
        }
      } else {
        this.userService.setUserProfile(null);
        this.teamService.clearTeams(); // Clear teams on logout
        this.loadingService.hide();
      }
    });
  }
}
