import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService, UserProfile } from '../services/auth.service';
import { MoodService, MoodLog } from '../services/mood.service';
import { AssessmentService } from '../services/assessment.service';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  @ViewChild('moodChart') moodChartCanvas!: ElementRef;
  
  user: UserProfile | null = null;
  recentMoods: MoodLog[] = [];
  lastAssessment: any = null;
  chart: any;

  constructor(
    private authService: AuthService,
    private moodService: MoodService,
    private assessmentService: AssessmentService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });

    this.moodService.getRecentMoods().subscribe(moods => {
      this.recentMoods = moods;
      this.updateChart();
    });

    this.assessmentService.getLatestAssessment().subscribe(res => {
      this.lastAssessment = res;
    });
  }

  async logMood(mood: MoodLog['mood']) {
    try {
      await this.moodService.logMood(mood);
      const toast = await this.toastCtrl.create({
        message: 'Mood hari ini tercatat! ❤️',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Gagal simpan mood:', error);
    }
  }

  getMoodLabel(mood: string): string {
    const labels: any = {
      'happy': 'Senang 😊',
      'neutral': 'Biasa 😐',
      'anxious': 'Cemas 😰',
      'sad': 'Sedih 😢',
      'angry': 'Marah 😡'
    };
    return labels[mood] || mood;
  }

  updateChart() {
    if (!this.moodChartCanvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.recentMoods.map(m => {
      const date = m.timestamp.toDate ? m.timestamp.toDate() : new Date(m.timestamp);
      // Jika data hari ini, tampilkan jam. Jika hari lain, tampilkan nama hari.
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('id-ID', { weekday: 'short' });
    });

    const data = this.recentMoods.map(m => {
      const values = { happy: 5, neutral: 4, anxious: 3, sad: 2, angry: 1 };
      return values[m.mood] || 3;
    });

    this.chart = new Chart(this.moodChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Level Mood',
          data: data,
          borderColor: '#e91e63',
          backgroundColor: 'rgba(233, 30, 99, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 1,
            max: 5,
            ticks: {
              callback: (value) => {
                const labels = { 5: '😊', 4: '😐', 3: '😰', 2: '😢', 1: '😡' };
                return labels[value as keyof typeof labels] || value;
              }
            }
          }
        }
      }
    });
  }

  goToAssessment() {
    this.navCtrl.navigateForward('/assessment');
  }

  async logout() {
    await this.authService.signOut();
    this.navCtrl.navigateRoot('/login');
  }

  async confirmDeleteAccount() {
    const alert = await this.alertCtrl.create({
      header: 'Hapus Akun?',
      message: 'Seluruh data Bunda (mood & assessment) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Ya, Hapus',
          role: 'destructive',
          handler: () => this.deleteAccount()
        }
      ]
    });
    await alert.present();
  }

  async deleteAccount() {
    try {
      await this.authService.deleteUserAccount();
      const toast = await this.toastCtrl.create({
        message: 'Akun berhasil dihapus. Sampai jumpa Bunda! ❤️',
        duration: 3000,
        color: 'dark'
      });
      await toast.present();
      this.navCtrl.navigateRoot('/login');
    } catch (error: any) {
      console.error('Error hapus akun:', error);
      let msg = 'Gagal menghapus akun.';
      if (error.code === 'auth/requires-recent-login') {
        msg = 'Demi keamanan, silakan login ulang sebelum menghapus akun.';
      }
      const toast = await this.toastCtrl.create({
        message: msg,
        duration: 4000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
