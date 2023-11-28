import { QuerySelAlgorithm } from '../shared';
import { HardDrive, Idle} from './HardDrive';
import {
  SECTORS_PER_TRACK,
  addQueryCompletionTime,
  incrementCompletedQueriesCounter,
} from './Main';
import { Query, TypeQuery } from './Query';

export class QueueExeption extends Error {}
let queryCompletionTime = 0;

export default class MyController {
  //поле що відповідає за поточний запит що виконується
  private queryUnderExecution?: Query;
  // поле відповідає за алгоритм вибору запитів для виконання
  private querySelectionAlgorithm: QuerySelAlgorithm;
  private hardDrive: HardDrive;

  constructor(hardDrive: HardDrive, querySelectionAlgorithm: QuerySelAlgorithm) {
    this.hardDrive = hardDrive;
    this.querySelectionAlgorithm = querySelectionAlgorithm;
  }

  // Метод для додання запиту до черги обробки
  addQueryToQueue(query: Query): void {
    this.querySelectionAlgorithm.tryAddQueryToQueue(query);
  }

  // Данийметод виконує запити з черги
  private executeQueryFromQueue(): void {
    // вибір запиту
    const queryToBeExecuted = this.querySelectionAlgorithm.selectQuery(this.hardDrive.state.position);

    if (queryToBeExecuted) {
      // якщо запит існує виконуємо переміщення жорсткого диска
      // до відповідної позиції для виконання запиту
      this.hardDrive.moveDriveTo(Math.floor(queryToBeExecuted.sectorNumber / SECTORS_PER_TRACK));
      // console.log(`TargetPosition: ${Math.floor(queryToBeExecuted.sectorNumber / SECTORS_PER_TRACK)}`)
      // виконуємо скидання часу виконання запиту
      queryCompletionTime = 0;
      // запам'ятовування запиту який виконується
      this.queryUnderExecution = queryToBeExecuted;
    } else {
      // якщо черга порожня, тоді очікуємо нових запитів
      this.queryUnderExecution = undefined;
    }
  }

  step(): void {
    // метод для обробки кроку запитів
    // console.log(this.queryUnderExecution)
    switch (this.queryUnderExecution) {
      // якщо немає запитів, що виконуються, виконуємо вибір запитів із черги
      case undefined:
        this.executeQueryFromQueue();
        break;

      // дефолтний кейс який відповідає що запит є
      default:
        // Інкрементуємо зач виконання запиту
        queryCompletionTime++;
        // перевірка жорсткого диску на чтан очікування та поля готовності
        if (this.hardDrive.state instanceof Idle && (<Idle>this.hardDrive.state).isReady) {
          // виконуємо операції на поточному секторі жорсткого диску
          this.hardDrive.performAnOperationOnCurrentSector();
          // console.log(completedQueriesCounter, this.queryUnderExecution.sectorNumber)
          // збільшуємо лічильник виконаних запитів
          incrementCompletedQueriesCounter(this.queryUnderExecution);
          // додавання часу виконання запиту до загального часу
          addQueryCompletionTime(queryCompletionTime);
          // перевірка чи запит був типу читання і повязаний із процесором
          if (this.queryUnderExecution.type === TypeQuery.READ && this.queryUnderExecution.process) {
            // якщо умова вертає істину передаємо результат процесу
            this.queryUnderExecution.process.provideTheQueryResult();
          }

          // обираємо новий запит із черги для обробки
          this.executeQueryFromQueue();
        }
        break;
    }
  }
}
