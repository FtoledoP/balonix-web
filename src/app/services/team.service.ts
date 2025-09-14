import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { UserService } from './user.service';

export interface Team {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  logoUrl?: string;
  captainId?: string;
  region?: string;
  district?: string;
  schedule?: {
    [key: string]: {
      startTime: string;
      endTime: string;
    } | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teamsSource = new BehaviorSubject<Team[]>([]);
  teams$ = this.teamsSource.asObservable();

  private activeTeamSource = new BehaviorSubject<Team | null>(null);
  activeTeam$ = this.activeTeamSource.asObservable();

  public pendingTeamId: string | null = null;
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
        const data = teamDocSnap.data();
        const createdAt = data['createdAt'];
        if (createdAt instanceof Timestamp) {
          data['createdAt'] = createdAt.toDate();
        }
        return { id: teamDocSnap.id, ...data } as Team;
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

  updateActiveTeam(userId: string, teamId: string): void {
    const userService = this.getUserService();
    
    // Set pending state
    this.pendingTeamId = teamId;

    // Optimistic UI Update
    const activeTeam = this.teamsSource.value.find(team => team.id === teamId) || null;
    this.activeTeamSource.next(activeTeam);

    // Usar el observable para obtener el perfil de usuario
    userService.userProfile$.pipe(take(1)).subscribe(currentProfile => {
      if (currentProfile) {
        userService.setUserProfile({ ...currentProfile, activeTeam: teamId });
      }
    });

    // Update Firestore in the background
    const fs = this.getFirebaseService();
    const userDocRef = doc(fs.firestore, 'users', userId);
    const startTime = performance.now();
    updateDoc(userDocRef, { activeTeam: teamId })
      .then(() => {
        const endTime = performance.now();
        console.log(`Firestore update took ${(endTime - startTime).toFixed(2)} ms.`);
        // Clear pending state on success
        if (this.pendingTeamId === teamId) {
          this.pendingTeamId = null;
        }
      })
      .catch(error => {
        console.error("Error updating active team in Firestore:", error);
        // Optional: Revert UI changes and clear pending state here if Firestore update fails
        if (this.pendingTeamId === teamId) {
          this.pendingTeamId = null;
        }
      });
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
    
    // Configurar la escucha de cambios en las membresías del equipo
    this.setupTeamMembershipsListener(userId, fs);
  }

  // Escuchar cambios en las membresías del equipo
  private teamMembershipsUnsubscribe: (() => void) | null = null;
  
  private setupTeamMembershipsListener(userId: string, fs: FirebaseService): void {
    // Limpiar cualquier suscripción anterior
    if (this.teamMembershipsUnsubscribe) {
      this.teamMembershipsUnsubscribe();
      this.teamMembershipsUnsubscribe = null;
    }
    
    // Configurar la escucha de cambios en las membresías
    const membershipQuery = query(collection(fs.firestore, 'teamMemberships'), where('userId', '==', userId));
    
    this.teamMembershipsUnsubscribe = onSnapshot(membershipQuery, async (snapshot) => {
      // Si hay cambios en las membresías, recargar los equipos
      if (!snapshot.empty) {
        const teamIds = snapshot.docs.map(doc => doc.data()['teamId']);
        const teamPromises = teamIds.map(id => this.getTeam(id, fs));
        const teams = (await Promise.all(teamPromises)).filter(team => team !== null) as Team[];
        
        // Actualizar la lista de equipos
        this.teamsSource.next(teams);
        
        // Mantener el equipo activo si existe, o seleccionar el primero si no hay activo
        const currentActiveTeam = this.activeTeamSource.getValue();
        if (currentActiveTeam) {
          const stillExists = teams.some(team => team.id === currentActiveTeam.id);
          if (!stillExists && teams.length > 0) {
            this.activeTeamSource.next(teams[0]);
          }
        } else if (teams.length > 0) {
          this.activeTeamSource.next(teams[0]);
        }
      } else {
        // Si no hay membresías, limpiar los equipos
        this.teamsSource.next([]);
        this.activeTeamSource.next(null);
      }
    }, (error) => {
      console.error('Error listening to team memberships:', error);
    });
  }
  
  clearTeams(): void {
    this.teamsSource.next([]);
    this.activeTeamSource.next(null);
    
    // Limpiar la suscripción a cambios en membresías
    if (this.teamMembershipsUnsubscribe) {
      this.teamMembershipsUnsubscribe();
      this.teamMembershipsUnsubscribe = null;
    }
  }
  
  // Método para obtener un equipo por su ID (para la página de perfil)
  getTeamById(teamId: string): Observable<Team | null> {
    return new Observable<Team | null>(observer => {
      const fs = this.getFirebaseService();
      const teamDocRef = doc(fs.firestore, 'teams', teamId);
      
      // Primero intentamos obtener el equipo de la lista actual
      const currentTeams = this.teamsSource.getValue();
      const teamFromCache = currentTeams.find(team => team.id === teamId);
      
      if (teamFromCache) {
        observer.next(teamFromCache);
      } else {
        // Si no está en la lista actual, lo buscamos en Firestore
        getDoc(teamDocRef)
          .then(docSnap => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const createdAt = data['createdAt'];
              if (createdAt instanceof Timestamp) {
                data['createdAt'] = createdAt.toDate();
              }
              const team = { id: docSnap.id, ...data } as Team;
              observer.next(team);
            } else {
              observer.next(null);
            }
          })
          .catch(error => {
            console.error('Error fetching team by ID:', error);
            observer.error(error);
          });
      }
    });
  }
}
