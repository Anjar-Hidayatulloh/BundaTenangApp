import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { LoadingController, ToastController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
  }

  async onLogin() {
    if (this.email && this.password) {
      const loading = await this.loadingCtrl.create({
        message: 'Masuk...',
        spinner: 'circles'
      });
      await loading.present();

      try {
        await this.authService.signIn(this.email, this.password);
        await loading.dismiss();
        this.navCtrl.navigateRoot('/home', { animated: true });
      } catch (error: any) {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'Login gagal: ' + error.message,
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    }
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }
}
