import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss'
})
export class ManagementComponent implements OnInit {
  teamId: string | null = null;
  isEditing: boolean = false;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Obtener el ID del equipo de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      this.teamId = params.get('id');
      this.isEditing = !!this.teamId;
      this.isLoading = false;
    });
  }
}
