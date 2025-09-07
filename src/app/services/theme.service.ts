import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = false;

  constructor() {
    const savedTheme = localStorage.getItem('darkMode');
    console.log('savedTheme', savedTheme);
    if (savedTheme) {
      this.darkMode = JSON.parse(savedTheme);
      if (this.darkMode) {
        document.body.classList.add('dark-mode');
      }
    }
  }

  isDarkMode() {
    return this.darkMode;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
