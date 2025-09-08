import { Component, OnInit, ElementRef, HostListener, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { UserService, UserProfile } from '../../services/user.service';
import { FirebaseService } from '../../services/firebase.service';
import { UserMenuComponent } from '../../components/user-menu/user-menu.component';
import { TeamRegisterModalComponent } from '../../components/team-register-modal/team-register-modal.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, UserMenuComponent, TeamRegisterModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  // Component properties
  userProfile$: Observable<UserProfile | null>;
  isUserMenuOpen = false;
  userMenuTop = 0;
  userMenuLeft = 0;
  isTeamRegisterModalOpen = false;

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

  toggleTeamRegisterModal() {
    this.isTeamRegisterModalOpen = !this.isTeamRegisterModalOpen;
  }

  toggleUserMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }

    if (this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
    } else {
      const target = event?.currentTarget as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        // Position centered above the element
        this.userMenuTop = rect.top - 140; // Adjusted for menu height + offset
        this.userMenuLeft = rect.left + rect.width / 2;
        this.isUserMenuOpen = true;
      }
    }
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
