import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let settings: jasmine.SpyObj<SettingsService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['login', 'registerClient'], { isLoggedIn: false });
    router = jasmine.createSpyObj('Router', ['navigate']);
    settings = jasmine.createSpyObj('SettingsService', ['loadSettings'], {
      storeName: "La Soupe a l'Oignon",
      logoFullUrl: '/assets/logo.png'
    });

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: SettingsService, useValue: settings }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', () => {
    expect(settings.loadSettings).toHaveBeenCalled();
  });

  describe('toggleView', () => {
    it('should switch between login and register views', () => {
      expect(component.isLoginView).toBeTrue();
      component.toggleView();
      expect(component.isLoginView).toBeFalse();
      component.toggleView();
      expect(component.isLoginView).toBeTrue();
    });

    it('should clear error on toggle', () => {
      component.error = 'some error';
      component.toggleView();
      expect(component.error).toBe('');
    });
  });

  describe('onLogin', () => {
    it('should call auth.login and navigate on success', () => {
      auth.login.and.returnValue(of({}));
      component.loginData = { email: 'a@b.com', password: 'pass' };

      component.onLogin();

      expect(auth.login).toHaveBeenCalledWith('a@b.com', 'pass');
      expect(router.navigate).toHaveBeenCalledWith(['/mesas']);
    });

    it('should set error on login failure', () => {
      auth.login.and.returnValue(throwError(() => ({ error: { message: 'Bad credentials' } })));
      component.onLogin();
      expect(component.error).toBe('Bad credentials');
    });
  });

  describe('onRegister', () => {
    it('should call auth.registerClient and navigate on success', () => {
      auth.registerClient.and.returnValue(of({}));
      component.registerData = { name: 'N', email: 'n@b.com', phone: '300', address: 'A', password: 'p' };

      component.onRegister();

      expect(auth.registerClient).toHaveBeenCalledWith(component.registerData);
      expect(router.navigate).toHaveBeenCalledWith(['/mesas']);
    });

    it('should set error on register failure', () => {
      auth.registerClient.and.returnValue(throwError(() => ({ error: { message: 'Email exists' } })));
      component.onRegister();
      expect(component.error).toBe('Email exists');
    });
  });

  describe('overlay phases', () => {
    it('should start with loading false', () => {
      expect(component.loading).toBeFalse();
      expect(component.preloading).toBeFalse();
    });

    it('should reset overlay after error', () => {
      auth.login.and.returnValue(throwError(() => ({ error: { message: 'err' } })));
      component.onLogin();
      expect(component.loading).toBeFalse();
      expect(component.preloading).toBeFalse();
    });
  });
});
