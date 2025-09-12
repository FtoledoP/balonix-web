import { Component, OnInit, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('{{enterTiming}}', style({ opacity: 1 }))
      ], { params: { enterTiming: '400ms ease-in' } }),
      transition(':leave', [
        animate('400ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoaderComponent implements OnInit {
  isPageReload = false;
  animationParams = { enterTiming: '400ms ease-in' };
  
  @HostBinding('class.page-reload') get pageReloadClass() { return this.isPageReload; }

  ngOnInit() {
    // Detectar si es una recarga de página
    if (performance.navigation && performance.navigation.type === 1) {
      this.isPageReload = true;
      this.animationParams = { enterTiming: '0ms' };
    } else if (window.performance) {
      // Para navegadores modernos
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0 && (navEntries[0] as any).type === 'reload') {
        this.isPageReload = true;
        this.animationParams = { enterTiming: '0ms' };
      }
    }
  }
}
