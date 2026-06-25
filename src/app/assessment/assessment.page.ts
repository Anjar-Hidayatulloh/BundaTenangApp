import { Component, OnInit } from '@angular/core';
import { AssessmentService } from '../services/assessment.service';
import { NavController, ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.page.html',
  styleUrls: ['./assessment.page.scss'],
  standalone: false,
})
export class AssessmentPage implements OnInit {
  questions = [
    { text: 'Saya mampu tertawa dan melihat sisi lucu dari berbagai hal.', score: 0 },
    { text: 'Saya memandang masa depan dengan rasa senang.', score: 0 },
    { text: 'Saya menyalahkan diri sendiri secara tidak perlu ketika ada hal yang salah.', score: 0 },
    { text: 'Saya merasa cemas atau khawatir tanpa alasan yang jelas.', score: 0 },
    { text: 'Saya merasa takut atau panik tanpa alasan yang sangat kuat.', score: 0 },
    { text: 'Banyak hal yang menumpuk sehingga saya merasa tidak sanggup menghadapinya.', score: 0 },
    { text: 'Saya merasa sangat tidak bahagia sehingga saya sulit tidur.', score: 0 },
    { text: 'Saya merasa sedih atau sengsara.', score: 0 },
    { text: 'Saya merasa sangat tidak bahagia sehingga saya menangis.', score: 0 },
    { text: 'Pikiran untuk menyakiti diri sendiri pernah muncul dalam benak saya.', score: 0 },
  ];

  currentStep = 0;
  totalScore = 0;
  isFinished = false;
  result: any = null;

  constructor(
    private assessmentService: AssessmentService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() { }

  answer(score: number) {
    this.totalScore += score;
    if (this.currentStep < this.questions.length - 1) {
      this.currentStep++;
    } else {
      this.finish();
    }
  }

  async finish() {
    this.isFinished = true;
    const category = this.assessmentService.getCategory(this.totalScore);
    const recommendation = this.assessmentService.getRecommendation(category);
    
    this.result = {
      score: this.totalScore,
      category,
      recommendation
    };

    await this.assessmentService.saveResult(this.totalScore);
  }

  goHome() {
    this.navCtrl.navigateRoot('/home');
  }
}
