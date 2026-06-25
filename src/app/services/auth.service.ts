import { Injectable, EnvironmentInjector, runInInjectionContext, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, map, shareReplay } from 'rxjs/operators';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  age?: number;
  pregnancyAge?: number; // in weeks
  pregnancyHistory?: string;
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<UserProfile | null>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private injector: EnvironmentInjector,
    private zone: NgZone
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          // Kita gunakan runInInjectionContext di sini untuk membungkus pemanggilan Firestore
          return runInInjectionContext(this.injector, () => {
            return this.afs.doc<UserProfile>(`users/${user.uid}`).valueChanges().pipe(
              map(data => {
                // Gunakan zone.run agar Angular langsung menyadari perubahan data (fix masalah harus diklik)
                return this.zone.run(() => {
                  return {
                    uid: user.uid,
                    email: user.email || (data ? data.email : ''),
                    displayName: (data && data.displayName) ? data.displayName : (user.displayName || 'Bunda'),
                    pregnancyAge: (data && data.pregnancyAge) ? Number(data.pregnancyAge) : 0,
                    age: (data && data.age) ? Number(data.age) : 0,
                    pregnancyHistory: (data && data.pregnancyHistory) ? data.pregnancyHistory : '-',
                    ...data
                  } as UserProfile;
                });
              })
            );
          });
        } else {
          return of(null);
        }
      }),
      // shareReplay(1) memastikan data terakhir "dikunci" di memori
      // sehingga saat refresh atau pindah halaman, data langsung muncul
      shareReplay(1)
    );
  }

  async signUp(email: string, password: string, profile: any) {
    const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
    if (credential.user) {
      const uid = credential.user.uid;
      
      // Update Auth Profile agar displayName tersedia langsung dari Auth
      await credential.user.updateProfile({
        displayName: profile.displayName
      });

      const data = {
        uid: uid,
        email: email,
        displayName: profile.displayName,
        age: Number(profile.age),
        pregnancyAge: Number(profile.pregnancyAge),
        pregnancyHistory: profile.pregnancyHistory,
        createdAt: new Date()
      };

      // Gunakan runInInjectionContext hanya untuk inisialisasi doc reference
      const userRef = runInInjectionContext(this.injector, () => this.afs.doc(`users/${uid}`));
      await userRef.set(data, { merge: true });
    }
  }

  async signIn(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async signOut() {
    return this.afAuth.signOut();
  }

  async deleteUserAccount() {
    const user = await this.afAuth.currentUser;
    if (user) {
      // 1. Hapus data di Firestore (Folder users)
      const userRef = runInInjectionContext(this.injector, () => this.afs.doc(`users/${user.uid}`));
      await userRef.delete();

      // 2. Hapus user di Firebase Auth
      await user.delete();
    }
  }
}
