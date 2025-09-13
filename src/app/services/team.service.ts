import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { UserService } from './user.service';

export interface Team {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teamsSource = new BehaviorSubject<Team[]>([]);
  teams$ = this.teamsSource.asObservable();

  private activeTeamSource = new BehaviorSubject<Team | null>(null);
  activeTeam$ = this.activeTeamSource.asObservable();

  private firebaseService?: FirebaseService;
  private userService?: UserService;

  constructor(private injector: Injector) { }

  // Helper to lazily get services
  private getFirebaseService(): FirebaseService {
    if (!this.firebaseService) {
      this.firebaseService = this.injector.get(FirebaseService);
    }
    return this.firebaseService;
  }

  private getUserService(): UserService {
    if (!this.userService) {
      this.userService = this.injector.get(UserService);
    }
    return this.userService;
  }

  async getTeam(teamId: string, fsInstance?: FirebaseService): Promise<Team | null> {
    const fs = fsInstance || this.getFirebaseService();
    try {
      const teamDocRef = doc(fs.firestore, 'teams', teamId);
      const teamDocSnap = await getDoc(teamDocRef);
      if (teamDocSnap.exists()) {
        return { id: teamDocSnap.id, ...teamDocSnap.data() } as Team;
      }
      return null;
    } catch (error) {
      console.error("Error fetching team:", error);
      return null;
    }
  }

  private async getTeamsForUser(userId: string, fs: FirebaseService): Promise<Team[]> {
    console.log('Fetching teams for userId:', userId); // DEBUG
    try {
      const membershipQuery = query(collection(fs.firestore, 'teamMemberships'), where('userId', '==', userId));
      const membershipSnapshot = await getDocs(membershipQuery);
      console.log('Found memberships:', membershipSnapshot.size); // DEBUG
      const teamIds = membershipSnapshot.docs.map(doc => doc.data()['teamId']);
      console.log('Team IDs found:', teamIds); // DEBUG
      
      if (teamIds.length > 0) {
        const teamPromises = teamIds.map(id => this.getTeam(id, fs));
        return (await Promise.all(teamPromises)).filter(team => team !== null) as Team[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching teams for user:", error);
      return [];
    }
  }

  async updateActiveTeam(userId: string, teamId: string): Promise<void> {
    const fs = this.getFirebaseService();
    const userService = this.getUserService();
    try {
      const userDocRef = doc(fs.firestore, 'users', userId);
      await updateDoc(userDocRef, { activeTeam: teamId });
      
      const activeTeam = this.teamsSource.value.find(team => team.id === teamId) || null;
      this.activeTeamSource.next(activeTeam);

      // Update user profile in UserService as well
      const currentProfile = await firstValueFrom(userService.userProfile$);
      if (currentProfile) {
        userService.setUserProfile({ ...currentProfile, activeTeam: teamId });
      }
    } catch (error) {
      console.error("Error updating active team:", error);
    }
  }

  async loadUserTeamsAndSetActive(userId: string, activeTeamId?: string): Promise<void> {
    const fs = this.getFirebaseService();
    const teams = await this.getTeamsForUser(userId, fs);
    this.teamsSource.next(teams);

    if (activeTeamId && teams.length > 0) {
      const activeTeam = teams.find(team => team.id === activeTeamId);
      this.activeTeamSource.next(activeTeam || null);
    } else {
      this.activeTeamSource.next(null);
    }
  }

  clearTeams(): void {
    this.teamsSource.next([]);
    this.activeTeamSource.next(null);
  }
}
