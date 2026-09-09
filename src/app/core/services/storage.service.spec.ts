import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_STORAGE } from '../firebase';
import { StorageService } from './storage.service';

const storageMocks = vi.hoisted(() => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('firebase/storage', () => storageMocks);

interface MockTask {
  on: ReturnType<typeof vi.fn>;
  snapshot: { ref: unknown };
}

describe('StorageService', () => {
  let service: StorageService;
  let task: MockTask;
  let handlers: {
    progress?: (snapshot: { bytesTransferred: number; totalBytes: number }) => void;
    error?: (err: unknown) => void;
    complete?: () => void;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.ref.mockImplementation((_storage, path: string) => ({ storage: true, path }));
    storageMocks.getDownloadURL.mockResolvedValue('https://download/avatar.jpg');
    storageMocks.deleteObject.mockResolvedValue(undefined);

    task = { on: vi.fn(), snapshot: { ref: 'storage-ref' } };
    handlers = {};
    task.on.mockImplementation(
      (
        _event: string,
        progress?: (s: { bytesTransferred: number; totalBytes: number }) => void,
        error?: (e: unknown) => void,
        complete?: () => void,
      ) => {
        handlers = { progress, error, complete };
      },
    );
    storageMocks.uploadBytesResumable.mockReturnValue(task);

    TestBed.configureTestingModule({
      providers: [{ provide: FIREBASE_STORAGE, useValue: {} }, StorageService],
    });
    service = TestBed.inject(StorageService);
  });

  describe('uploadAvatar', () => {
    const file = new File(['data'], 'avatar.png', { type: 'image/png' });

    it('should upload, resolve the download URL and emit it', async () => {
      const values: unknown[] = [];
      service.uploadAvatar('u1', file).subscribe((v) => values.push(v));
      expect(storageMocks.ref).toHaveBeenCalled();
      expect(storageMocks.uploadBytesResumable).toHaveBeenCalledWith(
        { storage: true, path: 'users/u1/avatar.png' },
        file,
        { contentType: 'image/png' },
      );
      handlers.complete!();
      // flush the async complete handler
      await new Promise((resolve) => setTimeout(resolve));
      expect(storageMocks.getDownloadURL).toHaveBeenCalledWith('storage-ref');
      expect(values).toEqual([{ url: 'https://download/avatar.jpg', path: 'users/u1/avatar.png' }]);
    });

    it('should fall back to jpg when the file extension is empty', () => {
      const noExt = new File(['x'], 'avatar.', { type: 'image/png' });
      service.uploadAvatar('u1', noExt).subscribe();
      expect(storageMocks.uploadBytesResumable).toHaveBeenCalledWith(
        { storage: true, path: 'users/u1/avatar.jpg' },
        noExt,
        { contentType: 'image/png' },
      );
    });

    it('should emit an error from the upload task', () => {
      const errors: unknown[] = [];
      service.uploadAvatar('u1', file).subscribe({ error: (e) => errors.push(e) });
      handlers.error!('upload-failed');
      expect(errors).toEqual(['upload-failed']);
    });

    it('should emit an error when resolving the download URL fails', async () => {
      storageMocks.getDownloadURL.mockRejectedValue(new Error('no-url'));
      const errors: unknown[] = [];
      service.uploadAvatar('u1', file).subscribe({ error: (e) => errors.push(e) });
      handlers.complete!();
      await new Promise((r) => setTimeout(r));
      expect(errors).toHaveLength(1);
    });
  });

  describe('uploadAvatarWithProgress', () => {
    const file = new File(['data'], 'avatar.png', { type: 'image/png' });

    it('should emit progress and then the final URL', async () => {
      const values: unknown[] = [];
      service.uploadAvatarWithProgress('u1', file).subscribe((v) => values.push(v));
      handlers.progress!({ bytesTransferred: 50, totalBytes: 200 });
      handlers.complete!();
      await new Promise((r) => setTimeout(r));
      expect(values).toEqual([
        { progress: 25 },
        {
          progress: 100,
          url: 'https://download/avatar.jpg',
          path: 'users/u1/avatar.png',
        },
      ]);
    });

    it('should emit an error when the upload fails', () => {
      const errors: unknown[] = [];
      service.uploadAvatarWithProgress('u1', file).subscribe({ error: (e) => errors.push(e) });
      handlers.error!('upload-failed');
      expect(errors).toEqual(['upload-failed']);
    });
  });

  describe('deleteFile', () => {
    it('should delete the file at the given path', async () => {
      await new Promise<void>((resolve) => {
        service.deleteFile('users/u1/avatar.png').subscribe(() => resolve());
      });
      expect(storageMocks.ref).toHaveBeenCalledWith({}, 'users/u1/avatar.png');
      expect(storageMocks.deleteObject).toHaveBeenCalled();
    });
  });
});
