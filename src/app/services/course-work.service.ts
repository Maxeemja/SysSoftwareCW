import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
// import { main } from '../../modules/Main';
import { Algorithm } from '../../shared';
import { main } from '../../modules/Main';
// import { firstTwoHundredQueryCompletionTimes } from '../../modules/Main';

@Injectable({
  providedIn: 'root',
})
export class CourseWorkService {
  constructor() {}

  public chartData$ = new BehaviorSubject<number[]>([]);
  public algo: Algorithm = null;
  public qty: number = null;
  public isLoading$ = new BehaviorSubject(false);

  public getData(): number[] {
    this.isLoading$.next(true);
    const data = main(this.algo, this.qty);
    this.chartData$.next(data);
    this.isLoading$.next(false);
    return data;
  }
}
