import { TestBed } from '@angular/core/testing';
import { CultivoService } from './cultivo.service';
import { ApiService } from '../../../core/services/api.service';
import { of } from 'rxjs';

describe('CultivoService', () => {
  let service: CultivoService;
  let apiServiceMock: any;

  beforeEach(() => {
    apiServiceMock = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([])),
      getById: jasmine.createSpy('getById').and.returnValue(of(null)),
      create: jasmine.createSpy('create').and.returnValue(of(null)),
      update: jasmine.createSpy('update').and.returnValue(of(null)),
      patch: jasmine.createSpy('patch').and.returnValue(of(null)),
    };

    TestBed.configureTestingModule({
      providers: [
        CultivoService,
        { provide: ApiService, useValue: apiServiceMock }
      ]
    });

    service = TestBed.inject(CultivoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getAll when listing all crops', (done) => {
    service.listarTodos().subscribe(() => {
      expect(apiServiceMock.getAll).toHaveBeenCalledWith('/cultivos');
      done();
    });
  });
});
