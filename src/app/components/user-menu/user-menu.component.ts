import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent {
  @Output() closeMenu = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onLogout() {
    this.logout.emit();
    this.closeMenu.emit();
  }
}
