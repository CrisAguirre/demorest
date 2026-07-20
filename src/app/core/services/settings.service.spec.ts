import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

describe('SettingsService', () => {
  let service: SettingsService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['getSettings']);
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: ApiService, useValue: api }
      ]
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadSettings', () => {
    it('should fetch settings from API and update subject', () => {
      const mockSettings = {
        _id: '1',
        storeName: 'Mi Tienda',
        logoUrl: '/logo.png',
        phone: '300123',
        address: 'Calle 1',
        whatsappNumber: '3001234567',
        theme: { primaryNeon: '#gold', secondaryNeon: '#bronze' }
      };
      api.getSettings.and.returnValue(of(mockSettings));

      service.loadSettings();

      expect(api.getSettings).toHaveBeenCalled();
      expect(service.storeName).toBe('Mi Tienda');
    });

    it('should use default store name when settings empty', () => {
      api.getSettings.and.returnValue(of({
        _id: '1', storeName: 'Demostore', logoUrl: '', phone: '',
        address: '', whatsappNumber: '', theme: { primaryNeon: '', secondaryNeon: '' }
      }));

      service.loadSettings();
      expect(service.storeName).toBe("La Soupe a l'Oignon");
    });
  });

  describe('computed properties', () => {
    it('should return empty string for whatsappNumber when no settings', () => {
      expect(service.whatsappNumber).toBe('');
      expect(service.whatsappLink).toBe('');
    });

    it('should return correct whatsapp link', () => {
      api.getSettings.and.returnValue(of({
        _id: '1', storeName: 'T', logoUrl: '', phone: '',
        address: '', whatsappNumber: '573001112233', theme: { primaryNeon: '', secondaryNeon: '' }
      }));
      service.loadSettings();
      expect(service.whatsappLink).toBe('https://wa.me/573001112233');
    });
  });
});
