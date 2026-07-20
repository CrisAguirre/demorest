import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', [], { currentUser: null });
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
    guard = TestBed.inject(RoleGuard);
  });

  it('should allow when user role is in expected roles', () => {
    Object.defineProperty(auth, 'currentUser', { get: () => ({ role: 'admin' }) });
    const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny when user role is not in expected roles', () => {
    Object.defineProperty(auth, 'currentUser', { get: () => ({ role: 'cajero' }) });
    const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should deny when no user', () => {
    Object.defineProperty(auth, 'currentUser', { get: () => null });
    const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeFalse();
  });
});
