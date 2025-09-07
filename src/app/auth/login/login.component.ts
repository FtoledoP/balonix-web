import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../components/loader/loader.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, LoaderComponent, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private firebaseService: FirebaseService,
    private toastr: ToastrService
  ) {}

  async login() {
    if (!this.email || !this.password) {
      this.toastr.warning('Todos los campos son obligatorios');
      return;
    }

    this.isLoading = true;

    try {
      const userCredential = await signInWithEmailAndPassword(this.firebaseService.auth, this.email, this.password);
      this.toastr.success('Inicio de sesión exitoso');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        this.toastr.error('Correo electrónico o contraseña incorrectos');
      } else {
        this.toastr.error('Error al iniciar sesión');
      }
    } finally {
      this.isLoading = false;
    }
  }

  testLoader() {
    this.isLoading = true;
  }
}
