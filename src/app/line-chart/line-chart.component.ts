import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { CourseWorkService } from '../services/course-work.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  public chart: any;

  constructor(private service: CourseWorkService) {}

  ngOnInit(): void {
    this.createChart();
  }

  createChart() {
    let data;
    this.service.chartData$.pipe(take(1)).subscribe((value) => {
      data = value;
    });
    // const data = this.service.getData();
    this.chart = new Chart('MyChart', {
      type: 'line',
      data: {
        labels: Array(200)
          .fill(0)
          .map((_, i) => i + 1),
        datasets: [
          {
            label: '# of Operations',
            data,
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
            beginAtZero: true,
          },
        },
      },
    });
  }
}
