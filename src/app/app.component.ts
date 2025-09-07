import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FirebaseService } from './services/firebase.service';
import { onAuthStateChanged } from 'firebase/auth';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'balonix-web';
  isLoggedIn = false;

  constructor(
    private firebaseService: FirebaseService,
    private themeService: ThemeService
  ) {
    onAuthStateChanged(this.firebaseService.auth, (user) => {
      this.isLoggedIn = !!user;
    });
  }
}
