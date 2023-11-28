import { getExponentiallyRandom } from './Main';
import { Process } from './Process';
export class Processor {
  // private hardDriveController: Controller;
  // Публічна змінна яка відповідає за масив процесів
  public processes: Process[];
  // кількість тактів кожному процесору для виконання
  private quantumeOfTime: number;
  private static DEFAULT_TIME_QUANTUM: number = 20;
  // час роботи процесора (необхідний для відслідковування кожної секунди роботи)
  public time: number = 0;
  private currActiveProcess: number = 0;
  // максимальне число запитів за секунду
  private maxQueriesPerSecond: number = 0;
  // міксимальна кількість запитів за дану секунду визначається експотенціальним розподілом (описаний в main.ts)
  private maxQueriesPerThisSecond: number = 0;
  private maxQueriesPerProcess: number[] = [];

  constructor(processes: Process[], maxQueriesPerSecond: number) {
    this.processes = processes;
    this.quantumeOfTime = Processor.DEFAULT_TIME_QUANTUM;
    this.maxQueriesPerSecond = maxQueriesPerSecond;
    this.maxQueriesPerProcess = new Array(processes.length).fill(0);
  }

  step(): void {
    if (this.time % 1000 === 0) {
      // обраховується експотенціально
      this.maxQueriesPerThisSecond = getExponentiallyRandom(this.maxQueriesPerSecond);

      let uniformDistributionUsedQueries = 0;
      this.maxQueriesPerProcess = new Array(this.processes.length).fill(0);

      let currentIndex = 0;
      // із постановки задачі на дану роботу потрібно
      // рівномірно розділити кількість запитів між всіма процесами
      while (this.maxQueriesPerThisSecond > uniformDistributionUsedQueries) {
        this.maxQueriesPerProcess[currentIndex]++;
        uniformDistributionUsedQueries++;
        currentIndex = (currentIndex + 1) % this.maxQueriesPerProcess.length;
      }

      this.processes.forEach((process) => {
        // виконуємо обнулення лічильника виконаних запитів кожного процесу
        // console.log(`Time ${this.time}: ${process.createdQueriesCounter}`)
        process.createdQueriesCounter = 0;
      });
    }

    // Перевірка чи є можливість у даного процечору створювати нові запити
    this.processes[this.currActiveProcess].canCreateQueries =
      this.processes[this.currActiveProcess].createdQueriesCounter < this.maxQueriesPerProcess[this.currActiveProcess];

    // для поточного процесу виконуємо виклик методу наступного кроку (step)
    this.processes[this.currActiveProcess].step();

    this.time++;
    // Перевірка кванту часу, якщо він пройшов то переходимо до наступного активного процесу
    if (this.time % this.quantumeOfTime === 0) {
      this.currActiveProcess = (this.currActiveProcess + 1) % this.processes.length;
    }
  }
}
