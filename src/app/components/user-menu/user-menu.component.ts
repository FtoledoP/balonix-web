import { Component, EventEmitter, Output, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

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
  @Output() createTeam = new EventEmitter<void>();

  @Input() top: number = 0;
  @Input() left: number = 0;
  @Input() centered: boolean = false;

  isDarkMode: boolean;

  constructor(private themeService: ThemeService) {
    this.isDarkMode = this.themeService.isDarkMode();
  }

  toggleTheme() {
    this.themeService.toggleDarkMode();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  @HostBinding('class.centered')
  get isCentered() {
    return this.centered;
  }

  @HostBinding('style.top.px')
  get styleTop() {
    return this.top;
  }

  @HostBinding('style.left.px')
  get styleLeft() {
    return this.left;
  }
  
  @HostBinding('class.right-aligned')
  get isRightAligned() {
    return !this.centered;
  }

  onCreateTeam() {
    this.createTeam.emit();
    this.closeMenu.emit();
  }

  onCloseMenu() {
    this.closeMenu.emit();
  }

  onLogout() {
    this.logout.emit();
    this.closeMenu.emit();
  }
}
