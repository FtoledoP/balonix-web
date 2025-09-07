import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../components/loader/loader.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, LoaderComponent, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  name = '';
  lastName = '';
  email = '';
  password = '';
  phoneNumber = '';
  isLoading = false;

  constructor(
    private firebaseService: FirebaseService,
    private toastr: ToastrService
  ) {}

  async register() {
    if (!this.name || !this.lastName || !this.email || !this.password || !this.phoneNumber) {
      this.toastr.warning('Todos los campos son obligatorios');
      return;
    }

    if (this.phoneNumber.length !== 8) {
      this.toastr.warning('El número de teléfono debe tener 8 dígitos');
      return;
    }

    this.isLoading = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(this.firebaseService.auth, this.email, this.password);
      const user = userCredential.user;

      try {
        await setDoc(doc(this.firebaseService.firestore, 'users', user.uid), {
          name: this.name,
          lastName: this.lastName,
          phoneNumber: `+569${this.phoneNumber}`,
          email: this.email,
          createdAt: new Date()
        });
        this.toastr.success('Usuario registrado con éxito');
      } catch (error) {
        await deleteUser(user);
        this.toastr.error('Error al guardar los datos del usuario');
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        this.toastr.error('El correo electrónico ya está en uso');
      } else {
        this.toastr.error('Error al registrar el usuario');
      }
    } finally {
      this.isLoading = false;
    }
  }
}
