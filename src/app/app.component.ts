import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CourseWorkService } from './services/course-work.service';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { Algorithm } from '../shared';
import { LineChartComponent } from './line-chart/line-chart.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatDividerModule,
    MatButtonModule,
    LineChartComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Курсова Робота';

  public algorithm: Algorithm = null;
  public opsQtyPerSec = null;
  public chartData$ = this.service.chartData$;
  public isLoading$ = this.service.isLoading$;

  constructor(private service: CourseWorkService) {}

  ngOnInit() {}

  onSubmit() {
    if (
      !this.algorithm ||
      !this.opsQtyPerSec ||
      (!this.algorithm && !this.opsQtyPerSec)
    )
      return alert('Виберіть алгоритм та к-ть');

    this.service.algo = this.algorithm;
    this.service.qty = this.opsQtyPerSec;
    this.service.getData();
  }
}
