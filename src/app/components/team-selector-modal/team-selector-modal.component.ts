import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../services/team.service';
import { timer } from 'rxjs';

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
  
  isLoading = false;
  
  selectTeam(team: Team): void {
    // No hacer nada si ya está cargando
    if (this.isLoading) return;
    
    // Mostrar overlay de carga
    this.isLoading = true;
    
    // Emitir el evento de selección de equipo
    this.teamSelected.emit(team);
    
    // Simular un tiempo de carga (puedes ajustar esto según tus necesidades)
    timer(1500).subscribe(() => {
      this.isLoading = false;
      this.close();
    });
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
