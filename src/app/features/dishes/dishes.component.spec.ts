import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { DishesComponent } from './dishes.component';
import { ApiService } from '../../core/services/api.service';

describe('DishesComponent', () => {
  let component: DishesComponent;
  let fixture: ComponentFixture<DishesComponent>;
  let api: jasmine.SpyObj<ApiService>;

  const plato = (over: any = {}) => ({
    _id: 'd1', name: 'Ajiaco', category: 'Sopas', price: 28000,
    isAvailable: true, imageUrl: '/uploads/ajiaco.jpg',
    ingredients: [{ ingredient: 'i1', quantity: 100 }],
    ...over
  });

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'getDishes', 'getIngredients', 'deleteDish', 'updateDish'
    ]);
    api.getDishes.and.returnValue(of([plato(), plato({ _id: 'd2', name: 'Bandeja', isAvailable: false })]));
    api.getIngredients.and.returnValue(of([
      { _id: 'i1', name: 'Papa', unit: 'g', stock: 500, minStock: 100 }
    ]));
    api.deleteDish.and.returnValue(of({}));
    api.updateDish.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [DishesComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(DishesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load dishes', () => {
    expect(component).toBeTruthy();
    expect(component.items.length).toBe(2);
  });

  it('should resolve photo urls against the api origin', () => {
    const url = component.fotoUrl('/uploads/ajiaco.jpg');
    expect(url).toContain('/uploads/ajiaco.jpg');
    expect(url.startsWith('http')).toBeTrue();
    expect(component.fotoUrl('https://x.com/f.jpg')).toBe('https://x.com/f.jpg');
    expect(component.fotoUrl('')).toBe('');
  });

  it('should filter by availability', () => {
    component.estadoFilter = 'disponible';
    component.applySort();
    expect(component.filteredItems.length).toBe(1);
    component.estadoFilter = 'nodisponible';
    component.applySort();
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0]._id).toBe('d2');
  });

  it('should keep deactivated dish visible locally', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.remove('d1');
    expect(component.items.find(i => i._id === 'd1')!.isAvailable).toBeFalse();
    expect(component.items.length).toBe(2);
  });

  it('should reactivate a dish', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.reactivate('d2');
    expect(api.updateDish).toHaveBeenCalledWith('d2', { isAvailable: true });
    expect(component.items.find(i => i._id === 'd2')!.isAvailable).toBeTrue();
  });

  it('should show ingredients with quantities in recipe view without costs', () => {
    component.viewRecipe(component.items[0]);
    expect(component.showRecipe).toBeTrue();
    expect(component.loadingRecipe).toBeFalse();
    expect(component.recipeError).toBe('');
    expect(component.recipeItems.length).toBe(1);
    expect(component.recipeItems[0].name).toBe('Papa');
    expect(component.recipeItems[0].quantity).toBe(100);
    expect(api.getRecipeCost).toBeUndefined();
  });

  it('should show notice when the dish has no recipe ingredients', () => {
    component.viewRecipe(plato({ _id: 'd3', ingredients: [] }));
    expect(component.loadingRecipe).toBeFalse();
    expect(component.recipeItems.length).toBe(0);
    expect(component.recipeError).toContain('aún no tiene ingredientes');
  });

  it('should echo the inventory unit next to each recipe quantity', () => {
    expect(component.unidadIngrediente('i1')).toBe('g');
    expect(component.unidadIngrediente('')).toBe('');
    expect(component.unidadIngrediente('no-existe')).toBe('');
  });

  it('should open and close full photo viewer', () => {
    expect(component.showFoto).toBeFalse();
    component.ampliarFoto();
    expect(component.showFoto).toBeTrue();
    component.showFoto = false;
    expect(component.showFoto).toBeFalse();
  });
});
