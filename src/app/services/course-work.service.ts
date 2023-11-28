import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Algorithm } from '../../shared';
import { getCalculations } from '../../modules/Main';
import { ChartTypeRegistry } from 'chart.js/auto';

export interface ChartData {
  xData: any[];
  yData: any[];
}

@Injectable({
  providedIn: 'root',
})
export class CourseWorkService {
  constructor() {}
  public chartData$ = new BehaviorSubject<ChartData[]>(null);
  public algo: Algorithm = null;
  public qty: number = null;
  public isLoading$ = new BehaviorSubject(false);

  public getData(): void {
    this.isLoading$.next(true);
    const data = getCalculations(this.algo, this.qty);
    this.chartData$.next(data);
    this.isLoading$.next(false);
  }

  public generateChartConfig(data: ChartData, xLabel, yLabel) {
    return {
      type: 'line' as keyof ChartTypeRegistry,
      data: {
        labels: data.xData,
        datasets: [
          {
            label: yLabel,
            data: data.yData,
            borderWidth: 1,
          },
        ],
      },
      options: {
        layout: {
          padding: 10,
        },
        scales: {
          y: {
            title: {
              font: {
                size: 16,
              },
              display: true,
              text: yLabel,
            },
            beginAtZero: true,
          },
          x: {
            title: {
              font: {
                size: 16,
              },
              display: true,
              text: xLabel,
            },
            beginAtZero: true,
          },
        },
      },
    };
  }
}
