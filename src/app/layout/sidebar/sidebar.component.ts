import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  userProfile$: Observable<UserProfile | null>;

  constructor(
    public sidebarService: SidebarService,
    private userService: UserService
  ) {
    this.userProfile$ = this.userService.userProfile$;
  }

  ngOnInit(): void {}

  toggleSidebar() {
    this.sidebarService.toggle();
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
}
