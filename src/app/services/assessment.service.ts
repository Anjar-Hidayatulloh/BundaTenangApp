import { Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { firstValueFrom, of } from 'rxjs';
import { take, switchMap, map } from 'rxjs/operators';

export interface AssessmentResult {
  userId: string;
  score: number;
  category: 'Normal' | 'Ringan' | 'Sedang' | 'Berat';
  recommendation: string;
  timestamp: any;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private injector: EnvironmentInjector
  ) {}

  async saveResult(score: number) {
    const user = await firstValueFrom(this.afAuth.authState.pipe(take(1)));
    if (!user) return;

    const category = this.getCategory(score);
    const recommendation = this.getRecommendation(category);

    return runInInjectionContext(this.injector, () => {
      return this.afs.collection('assessments').add({
        userId: user.uid,
        score,
        category,
        recommendation,
        timestamp: new Date()
      });
    });
  }

  getCategory(score: number): AssessmentResult['category'] {
    if (score <= 5) return 'Normal';
    if (score <= 10) return 'Ringan';
    if (score <= 15) return 'Sedang';
    return 'Berat';
  }

  getRecommendation(category: AssessmentResult['category']): string {
    switch (category) {
      case 'Normal':
        return 'Kondisi emosional Anda stabil. Teruskan pola hidup sehat dan luangkan waktu untuk relaksasi.';
      case 'Ringan':
        return 'Anda mungkin merasa sedikit stres. Cobalah teknik pernapasan atau bicarakan perasaan Anda dengan orang terdekat.';
      case 'Sedang':
        return 'Tingkat kecemasan Anda cukup terasa. Disarankan untuk beristirahat lebih banyak dan jika perlu berkonsultasi dengan konselor.';
      case 'Berat':
        return 'Anda menunjukkan gejala tekanan mental yang signifikan. Sangat disarankan untuk segera berkonsultasi dengan psikolog atau profesional kesehatan.';
      default:
        return '';
    }
  }

  getLatestAssessment() {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return runInInjectionContext(this.injector, () => {
            return this.afs.collection<AssessmentResult>('assessments', ref => 
              ref.where('userId', '==', user.uid)
            ).valueChanges();
          });
        } else {
          return of([]);
        }
      }),
      map(results => {
        if (!results || results.length === 0) return null;
        // Urutkan berdasarkan waktu terbaru di aplikasi (client-side)
        return results.sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return timeB - timeA; // Terbaru ke terlama
        })[0];
      })
    );
  }
}
