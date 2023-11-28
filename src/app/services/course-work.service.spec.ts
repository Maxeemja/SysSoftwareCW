import { TestBed } from '@angular/core/testing';

import { CourseWorkService } from './course-work.service';

describe('CourseWorkService', () => {
  let service: CourseWorkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseWorkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
