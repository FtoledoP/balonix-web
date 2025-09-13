import { Component, OnInit, ElementRef, HostListener, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { UserService, UserProfile } from '../../services/user.service';
import { FirebaseService } from '../../services/firebase.service';
import { UserMenuComponent } from '../../components/user-menu/user-menu.component';
import { TeamRegisterModalComponent } from '../../components/team-register-modal/team-register-modal.component';
import { TeamSelectorComponent } from '../../components/team-selector/team-selector.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, UserMenuComponent, TeamRegisterModalComponent, TeamSelectorComponent],
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
    // Verificar si el clic fue fuera del menú de usuario y del perfil de usuario
    if (this.isUserMenuOpen) {
      const userProfileElement = this.elementRef.nativeElement.querySelector('.user-profile');
      const userMenuElement = this.elementRef.nativeElement.querySelector('app-user-menu');
      
      // Si el clic no fue dentro del perfil ni dentro del menú, cerramos el menú
      if (!(userProfileElement?.contains(event.target) || userMenuElement?.contains(event.target))) {
        this.isUserMenuOpen = false;
      }
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
        const isSidebarOpen = this.sidebarService.currentValue;
        
        // Calcular posición antes de mostrar el menú
        if (isSidebarOpen) {
          // Con sidebar abierto, posicionar encima del perfil
          this.userMenuTop = rect.top - 200; // Aumentar el margen para que se vea completo
          this.userMenuLeft = rect.left + rect.width / 2;
        } else {
          // Con sidebar cerrado, posicionar a la derecha del perfil y más arriba
          this.userMenuTop = rect.top - 180; // Ajustar mucho más arriba para que se vean todas las opciones
          this.userMenuLeft = rect.right + 10; // 10px de margen
        }
        
        // Establecer la posición y mostrar el menú inmediatamente
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
