import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PosComponent } from './pos.component';
import { ApiService } from '../../core/services/api.service';

describe('PosComponent', () => {
  let component: PosComponent;
  let fixture: ComponentFixture<PosComponent>;
  let api: jasmine.SpyObj<ApiService>;

  const mockDishes = [
    { _id: 'd1', name: 'Pizza', price: 15000, category: 'Platos fuertes', isAvailable: true },
    { _id: 'd2', name: 'Ensalada', price: 8000, category: 'Entradas', isAvailable: false },
    { _id: 'd3', name: 'Sopa', price: 10000, category: 'Sopas', isAvailable: true },
  ];

  const mockTables = [
    { _id: 't1', number: 1, status: 'libre', isOccupied: false, currentSale: null },
    { _id: 't2', number: 2, status: 'ocupada', isOccupied: true, currentSale: { _id: 's1', total: 5000 } },
  ];

  const mockSale = {
    _id: 's1',
    total: 5000,
    items: [
      { productName: 'Pizza', quantity: 1, unitPrice: 15000, subtotal: 15000, esAdicional: false },
      { productName: 'Jugo', quantity: 1, unitPrice: 5000, subtotal: 5000, esAdicional: true }
    ],
    dishItems: [{ dishName: 'Sopa', quantity: 2, unitPrice: 10000, subtotal: 20000 }],
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'getDishes', 'getTables', 'getSettings', 'getSale', 'createSale', 'addItemsToSale', 'paySale'
    ]);
    api.getDishes.and.returnValue(of(mockDishes));
    api.getTables.and.returnValue(of(mockTables));
    api.getSettings.and.returnValue(of({ paymentMode: 'post-pago' }));
    api.getSale.and.returnValue(of(mockSale));
    api.createSale.and.returnValue(of({ _id: 's1' }));
    api.addItemsToSale.and.returnValue(of({ _id: 's1' }));
    api.paySale.and.returnValue(of({ _id: 's1', items: [], dishItems: [] }));

    await TestBed.configureTestingModule({
      declarations: [PosComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dishes on init, filter unavailable', () => {
    expect(api.getDishes).toHaveBeenCalled();
    expect(component.products.length).toBe(2);
    expect(component.filteredProducts.length).toBe(2);
  });

  it('should load tables on init', () => {
    expect(api.getTables).toHaveBeenCalled();
    expect(component.tables.length).toBe(2);
  });

  describe('addToCart', () => {
    it('should add a new product to cart', () => {
      component.addToCart(mockDishes[0]);
      expect(component.cart.length).toBe(1);
      expect(component.cart[0].productName).toBe('Pizza');
      expect(component.cart[0].quantity).toBe(1);
    });

    it('should increment quantity if product already in cart', () => {
      component.addToCart(mockDishes[0]);
      component.addToCart(mockDishes[0]);
      expect(component.cart.length).toBe(1);
      expect(component.cart[0].quantity).toBe(2);
    });

    it('should not add unavailable product', () => {
      component.addToCart(mockDishes[1]);
      expect(component.cart.length).toBe(0);
    });
  });

  describe('changeQty', () => {
    it('should increase quantity', () => {
      component.cart = [{ product: 'd1', productName: 'P', quantity: 1, unitPrice: 100, subtotal: 100 }];
      component.changeQty(0, 1);
      expect(component.cart[0].quantity).toBe(2);
      expect(component.cart[0].subtotal).toBe(200);
    });

    it('should remove item when quantity reaches 0', () => {
      component.cart = [{ product: 'd1', productName: 'P', quantity: 1, unitPrice: 100, subtotal: 100 }];
      component.changeQty(0, -1);
      expect(component.cart.length).toBe(0);
    });
  });

  describe('removeItem', () => {
    it('should remove item at index', () => {
      component.cart = [
        { product: 'd1', productName: 'P1', quantity: 1, unitPrice: 100, subtotal: 100 },
        { product: 'd2', productName: 'P2', quantity: 2, unitPrice: 200, subtotal: 400 },
      ];
      component.removeItem(0);
      expect(component.cart.length).toBe(1);
      expect(component.cart[0].productName).toBe('P2');
    });
  });

  describe('clearCart', () => {
    it('should empty the cart', () => {
      component.cart = [{ product: 'd1', productName: 'P', quantity: 1, unitPrice: 100, subtotal: 100 }];
      component.clearCart();
      expect(component.cart.length).toBe(0);
    });
  });

  describe('total', () => {
    it('should calculate sum of subtotals', () => {
      component.cart = [
        { product: 'd1', productName: 'P1', quantity: 2, unitPrice: 1000, subtotal: 2000 },
        { product: 'd2', productName: 'P2', quantity: 1, unitPrice: 3000, subtotal: 3000 },
      ];
      expect(component.total).toBe(5000);
    });

    it('should return 0 for empty cart', () => {
      expect(component.total).toBe(0);
    });
  });

  describe('filterProducts', () => {
    it('should filter by search term', () => {
      component.searchTerm = 'piz';
      component.filterProducts();
      expect(component.filteredProducts.length).toBe(1);
      expect(component.filteredProducts[0].name).toBe('Pizza');
    });

    it('should filter by category', () => {
      component.selectedCategory = 'Sopas';
      component.filterProducts();
      expect(component.filteredProducts.length).toBe(1);
      expect(component.filteredProducts[0].name).toBe('Sopa');
    });

    it('should show all available when no filter', () => {
      component.filterProducts();
      expect(component.filteredProducts.length).toBe(2);
    });
  });

  describe('finalizeSale', () => {
    it('should call api.createSale with cart items', () => {
      component.cart = [
        { product: 'd1', productName: 'P1', quantity: 2, unitPrice: 1000, subtotal: 2000 },
      ];
      component.finalizeSale();

      expect(api.createSale).toHaveBeenCalledWith({
        items: [{ product: 'd1', quantity: 2 }],
        paymentMethod: 'efectivo'
      });
    });

    it('should handle error gracefully', () => {
      api.createSale.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
      component.cart = [{ product: 'd1', productName: 'P1', quantity: 1, unitPrice: 100, subtotal: 100 }];
      component.finalizeSale();
      expect(component.processing).toBeFalse();
    });
  });

  describe('normalizeString', () => {
    it('should remove accents and lowercase', () => {
      expect(component.normalizeString('Café')).toBe('cafe');
      expect(component.normalizeString('Jalapeño')).toBe('jalapeno');
      expect(component.normalizeString('')).toBe('');
    });
  });

  describe('adicional flow', () => {
    it('should default to venta tab with no sale detail', () => {
      expect(component.activeTab).toBe('venta');
      expect(component.ventaActual).toBeNull();
    });

    it('should load venta detail when an occupied table is selected', () => {
      component.selectedTable = 2;
      component.onTableChange();
      expect(component.activeTab).toBe('venta');
      expect(api.getSale).toHaveBeenCalledWith('s1');
      expect(component.ventaActual._id).toBe('s1');
    });

    it('should combine items and dishItems in ventaItems', () => {
      component.ventaActual = mockSale;
      expect(component.ventaItems.length).toBe(3);
      expect(component.ventaItems[1].productName).toBe('Jugo');
      expect(component.ventaTotal).toBe(5000);
    });

    it('should discriminate iniciales vs adicionales', () => {
      component.ventaActual = mockSale;
      expect(component.ventaInicial.length).toBe(2);
      expect(component.ventaAdicionales.length).toBe(1);
      expect(component.ventaAdicionales[0].productName).toBe('Jugo');
    });

    it('should call addItemsToSale with sale id and switch back to venta tab', () => {
      component.selectedTable = 2;
      component.ventaActual = mockSale;
      component.cart = [
        { product: 'd1', productName: 'P1', quantity: 1, unitPrice: 1000, subtotal: 1000 },
      ];
      component.activeTab = 'adicional';
      spyOn(component, 'offerPrintComanda');
      component.finalizeSale();

      expect(api.addItemsToSale).toHaveBeenCalledWith('s1', {
        items: [{ product: 'd1', quantity: 1 }],
        paymentMethod: 'efectivo',
        tableNumber: 2
      });
      expect(component.cart.length).toBe(0);
      expect(component.activeTab).toBe('venta');
      expect(component.offerPrintComanda).toHaveBeenCalled();
    });
  });
});
