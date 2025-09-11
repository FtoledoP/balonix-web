import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { FirebaseService } from '../../services/firebase.service';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  currentStep = 1;
  currentSubStep = 'days';
  teamName = '';
  regions: any[] = [];
  comunas: string[] = [];
  selectedRegion: any = null;
  selectedComuna = '';
  selectedFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  
  availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  timeSlots: string[] = [];
  schedule: { [key: string]: { startTime: string, endTime: string } | null } = {};
  selectedDays: { day: string, timeSlot: { start: string, end: string } | null }[] = [];

  constructor(private dataService: DataService, private firebaseService: FirebaseService) {}

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
      console.error('Formulario incompleto');
      return;
    }

    const user = this.firebaseService.auth.currentUser;
    if (!user) {
      console.error('User not logged in');
      return;
    }

    let docRef;
    try {
      // Paso 1: Crear el documento en Firestore para obtener el ID
      docRef = await addDoc(collection(this.firebaseService.firestore, 'teams'), {
        name: this.teamName,
        region: this.selectedRegion.region,
        district: this.selectedComuna,
        captainId: user.uid,
        createdAt: Timestamp.now(),
        schedule: this.hasSelectedDaysWithTimes() ? this.schedule : null,
        logoUrl: '' // Dejar vacío por ahora
      });

      // Paso 2: Subir la imagen a Storage
      const filePath = `teams/${docRef.id}/${docRef.id}-LOGO`;
      const storageRef = ref(this.firebaseService.storage, filePath);
      // Verificar que selectedFile no sea nulo antes de usarlo
      if (this.selectedFile) {
        await uploadBytes(storageRef, this.selectedFile);
      } else {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      // Paso 3: Obtener la URL de descarga
      const logoUrl = await getDownloadURL(storageRef);

      // Paso 4: Actualizar el documento con la URL del logo
      await updateDoc(doc(this.firebaseService.firestore, 'teams', docRef.id), {
        logoUrl: logoUrl
      });

      console.log('Team registered successfully with ID: ', docRef.id);

    } catch (e) {
      console.error('Error registering team: ', e);
      // Rollback: si algo falla, eliminar el documento si se creó
      if (docRef) {
        // await deleteDoc(doc(this.firebaseService.firestore, 'teams', docRef.id));
      }
    }
  }
}
