import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { UserService } from '@core/services/user.service';
import { StorageService } from '@core/services/storage.service';
import { of } from 'rxjs';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        { provide: UserService, useValue: { update: () => of(null) } },
        { provide: StorageService, useValue: { uploadAvatarWithProgress: () => of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate file selection: missing, type and size', () => {
    component.onFileSelected({ target: {} } as never);
    expect(component.error()).toBeNull();

    component.onFileSelected({
      target: { files: [{ type: 'text/plain', size: 10 }], value: 'x' },
    } as never);
    expect(component.error()).toContain('Only JPG');

    component.onFileSelected({
      target: { files: [{ type: 'image/png', size: 10 * 1024 * 1024 }], value: 'x' },
    } as never);
    expect(component.error()).toContain('smaller than 2MB');
  });

  it('should compute avatar src/label and logout', () => {
    expect(component.avatarSrc()).toBeNull();
    expect(component.avatarLabel()).toBe('?');
    component.logout();
  });

  it('should render profile sections', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Profile');
  });

  it('should upload avatar when valid file selected', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const readSpy = vi
      .spyOn(FileReader.prototype, 'readAsDataURL')
      .mockImplementation(function (this: FileReader) {
        (this.onload as unknown as (e: unknown) => void)?.call(this, {
          target: { result: 'data:x' },
        });
      });
    component.onFileSelected({ target: { files: [file], value: 'x' } } as never);
    expect(readSpy).toHaveBeenCalled();
    readSpy.mockRestore();
  });

  it('should update avatar preview and save profile with a logged-in user', async () => {
    const { MockStore } = await import('@ngrx/store/testing');
    const mockStore = TestBed.inject(MockStore);
    mockStore.setState({
      auth: {
        ...initialAuthState,
        user: { id: 'u1', displayName: 'Ann', email: 'a@x.com', department: 'Fin' },
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.profileModel().displayName).toBe('Ann');
    expect(component.avatarSrc()).toBeNull();
    expect(component.avatarLabel()).toBe('A');
    component.previewUrl.set('data:preview');
    expect(component.avatarSrc()).toBe('data:preview');

    const userService = TestBed.inject(UserService);
    const updateSpy = vi.spyOn(userService, 'update').mockReturnValue(of(undefined));
    await (component as unknown as { saveProfile: (v: unknown) => void }).saveProfile({
      displayName: 'Ann Lee',
      email: 'a@x.com',
      department: '',
    });
    expect(updateSpy).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ displayName: 'Ann Lee' }),
    );
    await fixture.whenStable();
    expect(component.success()).toBe('Profile updated successfully');

    updateSpy.mockRestore();
  });
});
