import { Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';

export interface MoodLog {
  id?: string;
  userId: string;
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry';
  note?: string;
  timestamp: any;
}

@Injectable({
  providedIn: 'root'
})
export class MoodService {
  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private injector: EnvironmentInjector
  ) {}

  async logMood(mood: MoodLog['mood'], note?: string) {
    const user = await firstValueFrom(this.afAuth.authState.pipe(take(1)));
    if (!user) return;

    return runInInjectionContext(this.injector, () => {
      const data: any = {
        userId: user.uid,
        mood,
        timestamp: new Date()
      };

      // Hanya tambahkan note jika ada isinya
      if (note) {
        data.note = note;
      }

      return this.afs.collection('moods').add(data);
    });
  }

  getRecentMoods(limit = 7) {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return runInInjectionContext(this.injector, () => {
            return this.afs.collection<MoodLog>('moods', ref => 
              ref.where('userId', '==', user.uid)
                 .limit(limit)
            ).valueChanges({ idField: 'id' });
          });
        } else {
          return of([]);
        }
      }),
      map(moods => {
        // Urutkan berdasarkan waktu (paling lama ke paling baru)
        return moods.sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
      })
    );
  }
}
