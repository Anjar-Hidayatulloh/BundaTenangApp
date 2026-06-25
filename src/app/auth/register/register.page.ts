import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoadingController, ToastController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      displayName: ['', Validators.required],
      age: ['', Validators.required],
      pregnancyAge: ['', Validators.required],
      pregnancyHistory: ['', Validators.required],
    });
  }

  ngOnInit() {}

  async onRegister() {
    if (this.registerForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Mendaftarkan akun...',
        spinner: 'circles'
      });
      await loading.present();

      try {
        const formData = { ...this.registerForm.value };
        const email = formData.email;
        const password = formData.password;
        delete formData.email;
        delete formData.password;

        await this.authService.signUp(email, password, formData);
        await loading.dismiss();
        
        const toast = await this.toastCtrl.create({
          message: 'Registrasi berhasil!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        
        this.navCtrl.navigateRoot('/home', { animated: true });
      } catch (error: any) {
        await loading.dismiss();
        console.error('Register error:', error);
        const toast = await this.toastCtrl.create({
          message: 'Gagal daftar: ' + error.message,
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    }
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }
}
