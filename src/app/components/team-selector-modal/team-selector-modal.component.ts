import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../services/team.service';

@Component({
  selector: 'app-team-selector-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-selector-modal.component.html',
  styleUrl: './team-selector-modal.component.scss'
})
export class TeamSelectorModalComponent {
  @Input() teams: Team[] = [];
  @Input() activeTeam: Team | null = null;
  @Input() isVisible = false;
  
  @Output() teamSelected = new EventEmitter<Team>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() createTeamRequest = new EventEmitter<void>();
  
  selectTeam(team: Team): void {
    this.teamSelected.emit(team);
    this.close();
  }
  
  close(): void {
    this.closeModal.emit();
  }
  
  createTeam(): void {
    this.createTeamRequest.emit();
    this.close();
  }
  
  getTeamInitials(teamName: string): string {
    if (!teamName) return '';
    
    // Dividir el nombre por espacios y tomar la primera letra de cada palabra
    const words = teamName.split(' ');
    if (words.length === 1) {
      // Si solo hay una palabra, tomar las dos primeras letras
      return teamName.substring(0, 2).toUpperCase();
    } else {
      // Si hay múltiples palabras, tomar la primera letra de las dos primeras palabras
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  }
}
