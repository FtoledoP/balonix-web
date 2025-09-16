import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamService, Team } from '../../services/team.service';
import { DataService } from '../../services/data.service';
import { FirebaseService } from '../../services/firebase.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Component({
  selector: 'app-team-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './team-edit.component.html',
  styleUrls: ['./team-edit.component.scss']
})
export class TeamEditComponent implements OnInit {
  team: Team | null = null;
  editForm: FormGroup;
  isLoading = true;
  isSaving = false;

  regions: any[] = [];
  comunas: string[] = [];
  selectedFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  
  availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  timeSlots: string[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private fb: FormBuilder,
    private dataService: DataService,
    private firebaseService: FirebaseService,
    private toastr: ToastrService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      region: ['', Validators.required],
      district: ['', Validators.required],
      schedule: this.fb.group({})
    });
  }

  ngOnInit(): void {
    this.regions = this.dataService.getRegions();
    this.timeSlots = this.generateTimeSlots();
    this.initializeScheduleForm();

    const teamId = this.route.snapshot.paramMap.get('id');
    if (!teamId) {
      this.router.navigate(['/team-management']);
      return;
    }

    this.teamService.getTeamById(teamId).pipe(first()).subscribe(team => {
      if (team) {
        this.team = team;
        this.logoPreview = team.logoUrl || null;

        // Find the full region object to set the value in the form
        const selectedRegionObject = this.regions.find(r => r.region === team.region);
        if (selectedRegionObject) {
          this.comunas = selectedRegionObject.comunas;
        }

        this.editForm.patchValue({
          name: team.name,
          region: selectedRegionObject || '',
          district: team.district
        });

        if (team.schedule) {
          this.editForm.get('schedule')?.patchValue(team.schedule);
        }
      }
      this.isLoading = false;
    });
  }

  initializeScheduleForm() {
    const scheduleGroup = this.fb.group({});
    this.availableDays.forEach(day => {
      scheduleGroup.addControl(day, this.fb.control(null));
    });
    this.editForm.setControl('schedule', scheduleGroup);
  }

  onRegionChange(event: any) {
    const regionName = event.target.value;
    const region = this.regions.find(r => r.region === regionName);
    if (region) {
      this.comunas = region.comunas;
      this.editForm.get('district')?.setValue('');
    } else {
      this.comunas = [];
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] ?? null;
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.logoPreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  toggleDay(day: string) {
    const scheduleControl = this.editForm.get('schedule.' + day);
    if (scheduleControl?.value) {
      scheduleControl.setValue(null);
    } else {
      scheduleControl?.setValue({ startTime: '06:00', endTime: '23:30' });
    }
  }

  generateTimeSlots() {
    const slots = [];
    for (let h = 6; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 23 && m === 30) continue;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    slots.push('23:30');
    return slots;
  }

  get scheduleHasValues(): boolean {
    const schedule = this.editForm.get('schedule')?.value;
    return schedule && Object.values(schedule).some(v => v !== null);
  }

  async saveChanges(): Promise<void> {
    if (this.editForm.invalid || !this.team) {
      this.toastr.warning('Por favor completa todos los campos requeridos.');
      return;
    }

    this.isSaving = true;
    const formValue = this.editForm.value;
    const updatedData: Partial<Team> = {
      name: formValue.name,
      region: formValue.region.region, // Extract region name from object
      district: formValue.district,
      schedule: formValue.schedule
    };

    try {
      // Handle logo upload only if a new file is selected
      if (this.selectedFile) {
        const filePath = `teams/${this.team.id}/${this.team.id}-LOGO`;
        const logoStorageRef = ref(this.firebaseService.storage, filePath);
        await uploadBytes(logoStorageRef, this.selectedFile);
        updatedData.logoUrl = await getDownloadURL(logoStorageRef);
      }

      await this.teamService.updateTeam(this.team.id, updatedData);
      this.toastr.success('Equipo actualizado exitosamente');
      this.router.navigate(['/team-profile', this.team.id]);
    } catch (error) {
      console.error('Error updating team:', error);
      this.toastr.error('Hubo un error al actualizar el equipo.');
    } finally {
      this.isSaving = false;
    }
  }
}
