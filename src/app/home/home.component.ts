import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../services/firebase.service';
import { ThemeService } from '../services/theme.service';
import { Router } from '@angular/router';
import { signOut } from 'firebase/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  constructor(
    private firebaseService: FirebaseService,
    private themeService: ThemeService,
    private router: Router
  ) { }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  async logout() {
    try {
      await signOut(this.firebaseService.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}
