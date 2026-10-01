import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
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
      'getDishes', 'getIngredients', 'getRecipeCost', 'deleteDish', 'updateDish'
    ]);
    api.getDishes.and.returnValue(of([plato(), plato({ _id: 'd2', name: 'Bandeja', isAvailable: false })]));
    api.getIngredients.and.returnValue(of([]));
    api.getRecipeCost.and.returnValue(of({ salePrice: 28000, recipeCost: 8000, margin: 71, ingredients: [] }));
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

  it('should show loading then cost in recipe view', () => {
    component.viewRecipe(component.items[0]);
    expect(component.showRecipe).toBeTrue();
    expect(component.loadingRecipe).toBeFalse();
    expect(component.recipeCost.margin).toBe(71);
  });

  it('should show error when recipe cost fails', () => {
    api.getRecipeCost.and.returnValue(throwError(() => ({ error: { message: 'caído' } })));
    component.viewRecipe(component.items[0]);
    expect(component.loadingRecipe).toBeFalse();
    expect(component.recipeError).toContain('caído');
  });
});
