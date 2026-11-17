import { TestBed } from '@angular/core/testing';
import { Apoderado } from './apoderado';

describe('Apoderado', () => {
  let service: Apoderado;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Apoderado);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
