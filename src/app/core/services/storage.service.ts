import { inject, Service } from '@angular/core';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { Observable, from } from 'rxjs';
import { FIREBASE_STORAGE } from '../firebase';

@Service()
export class StorageService {
  private storage = inject(FIREBASE_STORAGE);

  uploadAvatar(uid: string, file: File): Observable<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `users/${uid}/avatar.${ext}`;
    const storageRef = ref(this.storage, path);

    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    return new Observable((subscriber) => {
      task.on(
        'state_changed',
        (_snapshot: UploadTaskSnapshot) => {},
        (error) => subscriber.error(error),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            subscriber.next({ url, path });
            subscriber.complete();
          } catch (e) {
            subscriber.error(e);
          }
        },
      );
    });
  }

  uploadAvatarWithProgress(
    uid: string,
    file: File,
  ): Observable<{ progress?: number; url?: string; path?: string }> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `users/${uid}/avatar.${ext}`;
    const storageRef = ref(this.storage, path);
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    return new Observable((subscriber) => {
      task.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          subscriber.next({ progress });
        },
        (error) => subscriber.error(error),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            subscriber.next({ progress: 100, url, path });
            subscriber.complete();
          } catch (e) {
            subscriber.error(e);
          }
        },
      );
    });
  }

  deleteFile(path: string): Observable<void> {
    return from(deleteObject(ref(this.storage, path)));
  }
}
