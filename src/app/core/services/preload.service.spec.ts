import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreloadService } from './preload.service';
import { environment } from '../../../environments/environment';

describe('PreloadService', () => {
  let service: PreloadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PreloadService]
    });
    service = TestBed.inject(PreloadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get/set cache', () => {
    it('should return null for missing key', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    it('should store and retrieve data within TTL', () => {
      service.set('mykey', { hello: 'world' }, 60_000);
      expect(service.get('mykey')).toEqual({ hello: 'world' });
    });

    it('should return null after TTL expires', () => {
      service.set('mykey', 'data', -1);
      expect(service.get('mykey')).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should remove single key', () => {
      service.set('a', 1, 60_000);
      service.set('b', 2, 60_000);
      service.invalidate('a');
      expect(service.get('a')).toBeNull();
      expect(service.get('b')).toEqual(2);
    });
  });

  describe('invalidatePrefix', () => {
    it('should remove keys with matching prefix', () => {
      service.set('products:all', 1, 60_000);
      service.set('products:{"page":"1"}', 2, 60_000);
      service.set('categories', 3, 60_000);
      service.invalidatePrefix('products');
      expect(service.get('products:all')).toBeNull();
      expect(service.get('products:{"page":"1"}')).toBeNull();
      expect(service.get('categories')).toEqual(3);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      service.set('a', 1, 60_000);
      service.set('b', 2, 60_000);
      service.clear();
      expect(service.get('a')).toBeNull();
      expect(service.get('b')).toBeNull();
    });
  });

  describe('warmup', () => {
    it('should ping health endpoint', () => {
      service.warmup();
      const req = httpMock.expectOne(`${environment.apiUrl}/health`);
      expect(req.request.method).toBe('GET');
      req.flush({ ok: true });
    });
  });

  describe('preload', () => {
    it('should fetch preload and populate cache', () => {
      const payload = {
        settings: { storeName: 'Test' },
        categories: [{ _id: 'c1', name: 'Cat' }],
        products: [{ _id: 'p1' }],
        alerts: [],
        salesDay: [],
        salesWeek: [],
        topProducts: [],
        currentCash: null
      };

      service.preload().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/preload`);
      expect(req.request.method).toBe('GET');
      req.flush(payload);

      expect(service.get('settings')).toEqual(payload.settings);
      expect(service.get('categories')).toEqual(payload.categories);
      expect(service.get('all-products')).toEqual(payload.products);
    });
  });

  describe('startKeepAlive / stopKeepAlive', () => {
    it('should not throw starting twice', () => {
      service.startKeepAlive();
      service.startKeepAlive();
      service.stopKeepAlive();
      service.stopKeepAlive();
    });
  });
});
