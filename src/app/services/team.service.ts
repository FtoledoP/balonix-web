import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

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

  constructor(private injector: Injector) { }

  // Helper to lazily get FirebaseService
  private getFirebaseService(): FirebaseService {
    if (!this.firebaseService) {
      this.firebaseService = this.injector.get(FirebaseService);
    }
    return this.firebaseService;
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

  async getTeamsForUser(userId: string): Promise<void> {
    const fs = this.getFirebaseService();
    console.log('Fetching teams for userId:', userId); // DEBUG
    try {
      const membershipQuery = query(collection(fs.firestore, 'teamMemberships'), where('userId', '==', userId));
      const membershipSnapshot = await getDocs(membershipQuery);
      console.log('Found memberships:', membershipSnapshot.size); // DEBUG
      const teamIds = membershipSnapshot.docs.map(doc => doc.data()['teamId']);
      console.log('Team IDs found:', teamIds); // DEBUG
      
      if (teamIds.length > 0) {
        const teamPromises = teamIds.map(id => this.getTeam(id));
        const teams = (await Promise.all(teamPromises)).filter(team => team !== null) as Team[];
        this.teamsSource.next(teams);
      } else {
        this.teamsSource.next([]);
      }
    } catch (error) {
      console.error("Error fetching teams for user:", error);
      this.teamsSource.next([]);
    }
  }

  async updateActiveTeam(userId: string, teamId: string): Promise<void> {
    console.log('Updating active team for userId:', userId, 'to teamId:', teamId); // DEBUG
    const fs = this.getFirebaseService();
    try {
      const userDocRef = doc(fs.firestore, 'users', userId);
      await updateDoc(userDocRef, { activeTeam: teamId });
      const activeTeam = await this.getTeam(teamId, fs); // Pass the instance here
      this.activeTeamSource.next(activeTeam);
    } catch (error) {
      console.error("Error updating active team:", error);
    }
  }

  clearTeams(): void {
    this.teamsSource.next([]);
    this.activeTeamSource.next(null);
  }
}
