import { Component, EventEmitter, Output, Input, HostBinding } from '@angular/core';
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

  @Input() top: number = 0;
  @Input() left: number = 0;
  @Input() centered: boolean = false;

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

  onLogout() {
    this.logout.emit();
    this.closeMenu.emit();
  }
}
