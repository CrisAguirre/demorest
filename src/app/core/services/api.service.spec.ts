import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { PreloadService } from './preload.service';
import { environment } from '../../../environments/environment';

class MockPreload {
  private store = new Map<string, any>();
  get<T>(key: string): T | null { return this.store.get(key) ?? null; }
  set(key: string, data: any, _ttl: number) { this.store.set(key, data); }
  invalidate(...keys: string[]) { keys.forEach(k => this.store.delete(k)); }
  invalidatePrefix(prefix: string) {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }
}

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let preload: MockPreload;

  beforeEach(() => {
    preload = new MockPreload();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: PreloadService, useValue: preload }
      ]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllProducts', () => {
    it('should fetch from API when cache empty', () => {
      service.getAllProducts().subscribe(res => {
        expect(res).toEqual([{ _id: 'p1' }]);
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/products/all`);
      expect(req.request.method).toBe('GET');
      req.flush([{ _id: 'p1' }]);
    });

    it('should return cached data without HTTP call', () => {
      preload.set('all-products', [{ _id: 'cached' }], 99999);
      service.getAllProducts().subscribe(res => {
        expect(res).toEqual([{ _id: 'cached' }]);
      });
      httpMock.expectNone(`${environment.apiUrl}/products/all`);
    });
  });

  describe('getProducts', () => {
    it('should fetch with params and cache', () => {
      service.getProducts({ page: '1' }).subscribe();
      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/products`);
      expect(req.request.params.get('page')).toBe('1');
      req.flush({ products: [] });
    });
  });

  describe('createProduct', () => {
    it('should POST and invalidate cache', () => {
      spyOn(preload, 'invalidate').and.callThrough();
      spyOn(preload, 'invalidatePrefix').and.callThrough();

      service.createProduct({ name: 'New' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/products`);
      expect(req.request.method).toBe('POST');
      req.flush({ _id: 'new' });

      expect(preload.invalidatePrefix).toHaveBeenCalledWith('products');
      expect(preload.invalidate).toHaveBeenCalledWith('all-products');
    });
  });

  describe('getCategories', () => {
    it('should use cache', () => {
      preload.set('categories', [{ name: 'C1' }], 99999);
      service.getCategories().subscribe(res => {
        expect(res).toEqual([{ name: 'C1' }]);
      });
      httpMock.expectNone(`${environment.apiUrl}/categories`);
    });
  });

  describe('createSale', () => {
    it('should POST and invalidate related caches', () => {
      spyOn(preload, 'invalidatePrefix');
      spyOn(preload, 'invalidate');

      service.createSale({ items: [] }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/sales`).flush({ _id: 's1' });

      expect(preload.invalidatePrefix).toHaveBeenCalledWith('products');
      expect(preload.invalidatePrefix).toHaveBeenCalledWith('sales-summary');
      expect(preload.invalidatePrefix).toHaveBeenCalledWith('top-products');
      expect(preload.invalidatePrefix).toHaveBeenCalledWith('alerts');
      expect(preload.invalidatePrefix).toHaveBeenCalledWith('finance');
      expect(preload.invalidate).toHaveBeenCalledWith('current-cash');
    });
  });

  describe('getSettings', () => {
    it('should return cached settings', () => {
      preload.set('settings', { storeName: 'Store' }, 99999);
      service.getSettings().subscribe(res => {
        expect(res).toEqual({ storeName: 'Store' });
      });
      httpMock.expectNone(`${environment.apiUrl}/settings`);
    });
  });

  describe('Kitchen Orders', () => {
    it('getKitchenOrders should call GET /kitchen-orders', () => {
      service.getKitchenOrders().subscribe(res => {
        expect(res).toEqual([{ _id: 'ko1', status: 'nuevo' }]);
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/kitchen-orders`);
      expect(req.request.method).toBe('GET');
      req.flush([{ _id: 'ko1', status: 'nuevo' }]);
    });

    it('getPendingKitchenOrders should call GET /kitchen-orders/pending', () => {
      service.getPendingKitchenOrders().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/kitchen-orders/pending`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('acceptKitchenOrder should call PATCH /kitchen-orders/:id/accept', () => {
      service.acceptKitchenOrder('ko123').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/kitchen-orders/ko123/accept`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ status: 'en_preparacion' });
    });

    it('deliverKitchenOrder should call PATCH /kitchen-orders/:id/deliver', () => {
      service.deliverKitchenOrder('ko123').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/kitchen-orders/ko123/deliver`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ status: 'entregado' });
    });

    it('markKitchenOrderPaid should call PATCH /kitchen-orders/:id/paid', () => {
      service.markKitchenOrderPaid('ko123').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/kitchen-orders/ko123/paid`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ status: 'pagado' });
    });

    it('printKitchenOrder should call GET /kitchen-orders/:id/print with blob responseType', () => {
      service.printKitchenOrder('ko123').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/kitchen-orders/ko123/print`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['%PDF'], { type: 'application/pdf' }));
    });
  });

  describe('Sales pay/cancel', () => {
    it('paySale should call POST /sales/:id/pay', () => {
      service.paySale('s1', { paymentMethod: 'efectivo' }).subscribe(res => {
        expect(res).toEqual({ _id: 's1', status: 'pagada' });
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/sales/s1/pay`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ paymentMethod: 'efectivo' });
      req.flush({ _id: 's1', status: 'pagada' });
    });

    it('cancelSale should call POST /sales/:id/cancel', () => {
      service.cancelSale('s1', { reason: 'cliente se fue' }).subscribe(res => {
        expect(res).toEqual({ _id: 's1', status: 'cancelada' });
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/sales/s1/cancel`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reason: 'cliente se fue' });
      req.flush({ _id: 's1', status: 'cancelada' });
    });
  });
});
