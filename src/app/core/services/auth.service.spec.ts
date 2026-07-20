import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { PreloadService } from './preload.service';
import { environment } from '../../../environments/environment';

class MockPreloadService {
  preload = jasmine.createSpy('preload').and.returnValue(of(null));
  startKeepAlive = jasmine.createSpy('startKeepAlive');
  stopKeepAlive = jasmine.createSpy('stopKeepAlive');
  clear = jasmine.createSpy('clear');
}

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let preload: MockPreloadService;

  function makeService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    preload = new MockPreloadService();
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: router },
        { provide: PreloadService, useValue: preload },
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    const service = makeService();
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST credentials, save session, preload', () => {
      const service = makeService();
      const httpMock = TestBed.inject(HttpTestingController);

      const mockRes = {
        user: { _id: '1', name: 'Test', email: 't@t.com', role: 'admin', isActive: true, createdAt: '' },
        accessToken: 'abc',
        refreshToken: 'ref'
      };

      service.login('t@t.com', 'pass').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockRes);

      expect(localStorage.getItem('accessToken')).toBe('abc');
      expect(localStorage.getItem('refreshToken')).toBe('ref');
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockRes.user);
      expect(preload.preload).toHaveBeenCalled();
      expect(preload.startKeepAlive).toHaveBeenCalled();

      httpMock.verify();
    });
  });

  describe('logout', () => {
    it('should clear storage, stop keepalive, navigate to login', () => {
      const service = makeService();
      localStorage.setItem('accessToken', 'x');
      localStorage.setItem('refreshToken', 'y');
      localStorage.setItem('user', '{}');

      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(preload.stopKeepAlive).toHaveBeenCalled();
      expect(preload.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('accessToken', 'x');
      const service = makeService();
      expect(service.isLoggedIn).toBeTrue();
    });

    it('should return false when no token', () => {
      const service = makeService();
      expect(service.isLoggedIn).toBeFalse();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has matching role', () => {
      localStorage.setItem('user', JSON.stringify({ _id: '1', role: 'admin' }));
      const service = makeService();
      expect(service.hasRole('admin')).toBeTrue();
      expect(service.hasRole('admin', 'cajero')).toBeTrue();
    });

    it('should return false when role does not match', () => {
      localStorage.setItem('user', JSON.stringify({ _id: '1', role: 'cajero' }));
      const service = makeService();
      expect(service.hasRole('admin')).toBeFalse();
    });
  });

  describe('refreshToken', () => {
    it('should POST refresh and save new tokens', () => {
      const service = makeService();
      const httpMock = TestBed.inject(HttpTestingController);

      localStorage.setItem('refreshToken', 'old-ref');
      service.refreshToken().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.body).toEqual({ refreshToken: 'old-ref' });
      req.flush({ accessToken: 'new-at', refreshToken: 'new-rt' });

      expect(localStorage.getItem('accessToken')).toBe('new-at');
      expect(localStorage.getItem('refreshToken')).toBe('new-rt');

      httpMock.verify();
    });
  });
});
