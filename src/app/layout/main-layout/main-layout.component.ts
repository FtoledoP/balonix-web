import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
})
export class MainLayoutComponent {
  constructor(public sidebarService: SidebarService) {}
  
  /**
   * Cierra el sidebar cuando se hace clic en el overlay
   * Solo es relevante en pantallas pequeñas
   */
  closeSidebar(): void {
    if (this.sidebarService.currentValue) {
      this.sidebarService.toggle();
    }
  }

  /**
   * Abre el sidebar cuando se hace clic en el botón flotante
   * Solo es relevante en pantallas pequeñas
   */
  openSidebar(): void {
    if (!this.sidebarService.currentValue) {
      this.sidebarService.toggle();
    }
  }
}
