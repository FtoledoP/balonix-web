import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { RegisterComponent } from '../../team/register/register.component';

@Component({
  selector: 'app-team-register-modal',
  standalone: true,
  imports: [CommonModule, RegisterComponent],
  templateUrl: './team-register-modal.component.html',
  styleUrls: ['./team-register-modal.component.scss'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slide', [
      transition(':enter', [
        style({ transform: 'translateY(20px)' }),
        animate('300ms ease-in-out', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class TeamRegisterModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  onClose() {
    this.closeModal.emit();
  }
}
