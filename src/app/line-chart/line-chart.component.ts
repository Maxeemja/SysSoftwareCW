import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart, { ChartTypeRegistry } from 'chart.js/auto';
import { CourseWorkService } from '../services/course-work.service';
import { Subject, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent implements OnInit, OnDestroy {
  public chart: Chart;
  public chart2: Chart;

  private destroy$ = new Subject<boolean>();

  constructor(private service: CourseWorkService) {}

  ngOnInit(): void {
    this.createCharts();
  }

  createCharts() {
    this.service.chartData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(([data1, data2]) => {
        const config1 = this.service.generateChartConfig(
          data1,
          'Час, мс',
          'Номер доріжки'
        );
        const config2 = this.service.generateChartConfig(
          data2,
          'Номер запиту',
          'Час виконання запиту, мс'
        );

        if (this.chart2 || this.chart) {
          this.chart.destroy();
          this.chart2.destroy();
        }

        this.chart = new Chart('MyChart1', config1);
        this.chart2 = new Chart('MyChart2', config2);
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
