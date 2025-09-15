import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { FirebaseService } from '../../services/firebase.service';
import { collection, addDoc, updateDoc, doc, deleteDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

// Interfaz para el objeto dayOrder
interface DayOrderType {
  [key: string]: number;
  'Lunes': number;
  'Martes': number;
  'Miércoles': number;
  'Jueves': number;
  'Viernes': number;
  'Sábado': number;
  'Domingo': number;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  @Output() teamCreated = new EventEmitter<void>();
  
  currentStep = 1;
  currentSubStep = 'days';
  teamName = '';
  regions: any[] = [];
  comunas: string[] = [];
  selectedRegion: any = null;
  selectedComuna = '';
  selectedFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  isLoading = false;
  
  availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  timeSlots: string[] = [];
  schedule: { [key: string]: { startTime: string, endTime: string } | null } = {};
  selectedDays: { day: string, timeSlot: { start: string, end: string } | null }[] = [];
  
  // Orden de los días para ordenar correctamente
  dayOrder: DayOrderType = {
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Domingo': 7
  };

  constructor(
    private dataService: DataService, 
    private firebaseService: FirebaseService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    this.regions = this.dataService.getRegions();
    this.timeSlots = this.generateTimeSlots();
    this.availableDays.forEach(day => {
      this.schedule[day] = null;
      this.selectedDays.push({ day: day, timeSlot: null });
    });
  }

  onRegionChange() {
    if (this.selectedRegion) {
      this.comunas = this.selectedRegion.comunas;
    }
    this.selectedComuna = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] ?? null;
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Add some visual feedback
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Remove visual feedback
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Remove visual feedback

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
      event.dataTransfer.clearData();
    }
  }

  clearFileSelection() {
    this.selectedFile = null;
    this.logoPreview = null;
  }

  toggleDay(day: string) {
    if (this.schedule[day]) {
      this.schedule[day] = null;
      const dayIndex = this.selectedDays.findIndex(d => d.day === day);
      if (dayIndex !== -1) {
        this.selectedDays[dayIndex].timeSlot = null;
      }
    } else {
      this.schedule[day] = { startTime: '06:00', endTime: '23:30' };
      const dayIndex = this.selectedDays.findIndex(d => d.day === day);
      if (dayIndex !== -1) {
        this.selectedDays[dayIndex].timeSlot = { start: '06:00', end: '23:30' };
      }
    }
  }

  generateTimeSlots() {
    const slots = [];
    for (let h = 6; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 23 && m === 30) continue;
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        slots.push(`${hour}:${minute}`);
      }
    }
    slots.push('23:30');
    return slots;
  }

  updateSelectedDayTime(day: string) {
    if (this.schedule[day]) {
      const dayIndex = this.selectedDays.findIndex(d => d.day === day);
      if (dayIndex !== -1) {
        this.selectedDays[dayIndex].timeSlot = {
          start: this.schedule[day]!.startTime,
          end: this.schedule[day]!.endTime
        };
      }
    }
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    } else if (this.currentStep === 3) {
      if (this.currentSubStep === 'days') {
        this.setCurrentSubStep('times');
      } else if (this.currentSubStep === 'times') {
        this.setCurrentSubStep('summary');
      }
    }
  }

  setCurrentSubStep(step: string) {
    this.currentSubStep = step;
  }
  
  hasSelectedDaysWithTimes(): boolean {
    return this.selectedDays.some(day => day.timeSlot !== null);
  }
  
  hasSelectedDays(): boolean {
    return this.availableDays.some(day => this.schedule[day] !== null);
  }
  
  // Método para obtener los días seleccionados ordenados de lunes a domingo
  getOrderedSelectedDays(): { day: string, timeSlot: { start: string, end: string } | null }[] {
    return [...this.selectedDays]
      .filter(dayObj => dayObj.timeSlot !== null)
      .sort((a, b) => {
        // Verificar que las claves existen en dayOrder
        const dayOrderA = this.dayOrder[a.day as keyof DayOrderType] || 0;
        const dayOrderB = this.dayOrder[b.day as keyof DayOrderType] || 0;
        return dayOrderA - dayOrderB;
      });
  }

  isFormValid(): boolean {
    // Verificar que todos los campos requeridos estén completos
    const step1Valid = this.teamName && this.selectedRegion && this.selectedComuna;
    const step2Valid = this.selectedFile !== null;
    const step3Valid = this.hasSelectedDaysWithTimes();
    
    // Verificar que estemos en el paso final y en la subpágina de resumen
    const isOnFinalStep = this.currentStep === 3 && this.currentSubStep === 'summary';
    
    // El formulario es válido si todos los campos están completos y estamos en el paso final
    return step1Valid && step2Valid && step3Valid && isOnFinalStep;
  }

  prevStep() {
    if (this.currentStep > 1) {
      if (this.currentStep === 3) {
        if (this.currentSubStep === 'times') {
          this.setCurrentSubStep('days');
          return;
        } else if (this.currentSubStep === 'summary') {
          this.setCurrentSubStep('times');
          return;
        }
      }
      this.currentStep--;
    }
  }

  getStepTitle() {
    switch (this.currentStep) {
      case 1:
        return 'Datos Principales';
      case 2:
        return 'Logo';
      case 3:
        return 'Disponibilidad Semanal';
      default:
        return 'Registrar Equipo';
    }
  }

  async registerTeam() {
    // Verificar que todos los campos requeridos estén completos
    if (!this.isFormValid()) {
      this.toastr.warning('Por favor completa todos los campos requeridos');
      return;
    }

    const user = this.firebaseService.auth.currentUser;
    if (!user) {
      this.toastr.error('Debes iniciar sesión para crear un equipo');
      return;
    }

    if (!this.selectedFile) {
      this.toastr.error('Debes seleccionar un logo para el equipo');
      return;
    }

    // Activar el estado de carga
    this.isLoading = true;

    let teamDocRef;
    let logoStorageRef;
    let logoUrl = '';
    
    try {
      // Crear un batch para operaciones de Firestore
      const batch = writeBatch(this.firebaseService.firestore);
      
      // Paso 1: Crear el documento en Firestore para obtener el ID
      teamDocRef = doc(collection(this.firebaseService.firestore, 'teams'));
      
      // Preparar los datos del equipo
      const teamData = {
        name: this.teamName,
        region: this.selectedRegion.region,
        district: this.selectedComuna,
        captainId: user.uid,
        createdAt: Timestamp.now(),
        schedule: this.hasSelectedDaysWithTimes() ? this.schedule : null,
        logoUrl: '' // Se actualizará después
      };
      
      // Añadir la creación del equipo al batch
      batch.set(teamDocRef, teamData);
      
      // Paso 2: Subir la imagen a Storage
      const filePath = `teams/${teamDocRef.id}/${teamDocRef.id}-LOGO`;
      logoStorageRef = ref(this.firebaseService.storage, filePath);
      
      // Subir la imagen
      await uploadBytes(logoStorageRef, this.selectedFile);
      
      // Paso 3: Obtener la URL de descarga
      logoUrl = await getDownloadURL(logoStorageRef);
      
      // Paso 4: Actualizar el documento con la URL del logo
      batch.update(teamDocRef, { logoUrl: logoUrl });
      
      // Paso 5: Crear el documento en la colección teamMemberships
      const membershipRef = doc(collection(this.firebaseService.firestore, 'teamMemberships'));
      batch.set(membershipRef, {
        joinedAt: Timestamp.now(),
        userId: user.uid,
        teamId: teamDocRef.id,
        role: 'captain'
      });
      
      // Ejecutar todas las operaciones de Firestore como una transacción
      await batch.commit();
      
      this.toastr.success('Equipo creado exitosamente');
      
      // Emitir evento para cerrar el modal
      this.teamCreated.emit();
      
      // Navegar a la página de inicio
      this.router.navigate(['/home']);

    } catch (error) {
      this.toastr.error('Error al crear el equipo. Por favor intenta nuevamente.');
      console.error('Error registering team: ', error);
      
      // Rollback: si algo falla, eliminar la imagen si se subió
      try {
        if (logoStorageRef) {
          await deleteObject(logoStorageRef).catch(err => console.error('Error deleting logo:', err));
        }
        // No es necesario hacer rollback de las operaciones de Firestore
        // ya que el batch garantiza que todas las operaciones se ejecutan o ninguna
      } catch (rollbackError) {
        console.error('Error during rollback: ', rollbackError);
      }
    } finally {
      // Desactivar el estado de carga independientemente del resultado
      this.isLoading = false;
    }
  }
}
