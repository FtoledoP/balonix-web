import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { UserService, UserProfile } from '../../services/user.service';
import { FirebaseService } from '../../services/firebase.service';
import { UserMenuComponent } from '../../components/user-menu/user-menu.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, UserMenuComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  userProfile$: Observable<UserProfile | null>;
  isUserMenuOpen = false;

  constructor(
    public sidebarService: SidebarService,
    private userService: UserService,
    private firebaseService: FirebaseService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.userProfile$ = this.userService.userProfile$;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isUserMenuOpen && !this.elementRef.nativeElement.querySelector('.user-profile').contains(event.target)) {
      this.isUserMenuOpen = false;
    }
  }

  ngOnInit(): void {}

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  toggleUserMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  getInitials(name: string, lastName: string): string {
    const firstName = name.split(' ')[0];
    const firstLastName = lastName.split(' ')[0];
    return `${firstName.charAt(0)}${firstLastName.charAt(0)}`.toUpperCase();
  }

  getDisplayName(name: string, lastName: string): string {
    const firstName = name.split(' ')[0];
    const firstLastName = lastName.split(' ')[0];
    return `${firstName} ${firstLastName}`;
  }

  async logout() {
    await this.firebaseService.auth.signOut();
    this.router.navigate(['/login']);
  }
}
