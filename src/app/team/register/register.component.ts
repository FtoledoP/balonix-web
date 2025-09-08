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
  teamName = '';
  regions: any[] = [];
  comunas: string[] = [];
  selectedRegion: any = null;
  selectedComuna = '';
  selectedFile: File | null = null;
  
  hasSchedule = false;
  availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  timeSlots: string[] = [];
  schedule: { [key: string]: { startTime: string, endTime: string } | null } = {};

  constructor(private dataService: DataService, private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.regions = this.dataService.getRegions();
    this.timeSlots = this.generateTimeSlots();
    this.availableDays.forEach(day => this.schedule[day] = null);
  }

  onRegionChange() {
    if (this.selectedRegion) {
      this.comunas = this.selectedRegion.comunas;
    }
    this.selectedComuna = '';
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] ?? null;
  }

  toggleDay(day: string) {
    if (this.schedule[day]) {
      this.schedule[day] = null;
    } else {
      this.schedule[day] = { startTime: '06:00', endTime: '23:30' };
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

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  async registerTeam() {
    if (!this.selectedFile) {
      console.error('No logo selected');
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
        schedule: this.hasSchedule ? this.schedule : null,
        logoUrl: '' // Dejar vacío por ahora
      });

      // Paso 2: Subir la imagen a Storage
      const filePath = `teams/${docRef.id}/${docRef.id}-LOGO`;
      const storageRef = ref(this.firebaseService.storage, filePath);
      await uploadBytes(storageRef, this.selectedFile);

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
