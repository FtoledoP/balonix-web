import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { LoaderComponent } from './components/loader/loader.component';
import { FirebaseService } from './services/firebase.service';
import { onAuthStateChanged } from 'firebase/auth';
import { ThemeService } from './services/theme.service';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, CommonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'balonix-web';
  isLoggedIn = false;
  isLoading$;

  constructor(
    private firebaseService: FirebaseService,
    private themeService: ThemeService,
    private loadingService: LoadingService
  ) {
    this.isLoading$ = this.loadingService.loading$;
    onAuthStateChanged(this.firebaseService.auth, (user) => {
      this.isLoggedIn = !!user;
    });
  }
}
