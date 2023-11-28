import {
  LOOKState,
  RequestSelectionAlgorithm,
  StateQueueActive,
} from '../shared';
import { SECTORS_PER_TRACK } from './Main';
import { Query, TypeQuery } from './Query';

// Інтерфейс для алгоритмів вибору запитів

// Виключення, яке сигналізує про переповнення черги
class QueueFullException extends Error {}

// представлення необхідна для зміни черг
// у алгоритмі Circular F-LOOK для відрізняння черг

// Перший алгоритм який є досить легким в реалізації:
// FIFO (first input first output). Запити відправляються
// контролеру жорсткого диску відповідно до часу їхнього
// додавання до черги запитів.
export class FIFO implements RequestSelectionAlgorithm {
  // максимальний розмір черги
  private maxQueueSize: number;
  // черга яка формується як масив запитів
  private queue: Query[];
  constructor(maxQueueSize: number) {
    this.maxQueueSize = maxQueueSize;
    this.queue = [];
  }

  tryAddQueryToQueue(query: Query): void {
    // Виконується перевірка чи черга повна, якщо так то виконується виключення
    if (this.queue.length === this.maxQueueSize) {
      throw new QueueFullException();
    }

    // в іншому випадку додаємо запит до черги
    this.queue.push(query);
  }

  // метод для вибору запиту для виконання
  selectQuery(): Query | undefined | null {
    // перевірка на порожню чергу
    if (this.queue.length > 0) {
      // якщо черга не порожня обираємо перший елемент черги
      return this.queue.shift();
    } else {
      // якщо черга порожня вертаємо null
      return null;
    }
  }
}
// Другий алгоритм:
// Алгоритм SSTF (shortest seek time first).
//Контролеру жорсткого диску відправляється запит, який
// потребує менше часу для виконання, тобто номер доріжки
//якого ближче до номеру доріжки попереднього відправленого запиту.
export class SSTF implements RequestSelectionAlgorithm {
  // максимальний розмір черги
  private maxQueueSize: number;
  // черга яка формується як масив запитів
  private queue: Query[];

  constructor(maxQueueSize: number) {
    this.maxQueueSize = maxQueueSize;
    this.queue = [];
  }

  tryAddQueryToQueue(query: Query): void {
    // Виконується перевірка чи черга повна, якщо так то виконується виключення
    if (this.queue.length === this.maxQueueSize) {
      throw new QueueFullException();
    }

    // в іншому випадку додаємо запит до черги
    this.queue.push(query);
  }

  selectQuery(currentDrivePosition: number) {
    // Перевірка чи черга пуста
    if (this.queue.length === 0) {
      // якщо черга пуста вертаємо null
      return null;
    }
    // Знаходження найблищого запиту до поточного
    const closestTrackQuery = this.queue.reduce((closest, query) => {
      const distance = Math.abs(
        currentDrivePosition -
          Math.floor(query.sectorNumber / SECTORS_PER_TRACK)
      );
      // Порівнюємо відстань від поточного положення до блока запиту з відстанню до блока найближчого запиту
      if (
        distance <
        Math.abs(
          currentDrivePosition -
            Math.floor(closest.sectorNumber / SECTORS_PER_TRACK)
        )
      ) {
        return query;
      }
      // в іншому випадку вертаємо акумулююче значення closest
      return closest;
    });

    // Якщо найближчий запит знайдено, видаляємо його з черги
    if (closestTrackQuery !== null) {
      // знаходио індекс в черзі запитів
      const index = this.queue.indexOf(closestTrackQuery);
      // вирізаємо даний запит
      this.queue.splice(index, 1);
    }
    // Повертається найближчий запит для виконання
    return closestTrackQuery;
  }
}

// Клас F_LOOK реалізує алгоритм вибору запиту для диска
export class F_LOOK implements RequestSelectionAlgorithm {
  // Максимальний розмір черги запитів
  private maxQueueSize: number;

  // Стан активної черги
  private state: StateQueueActive = StateQueueActive.FIRST_QUEUE_ACTIVE;

  // Напрямок пошуку (зростаючий або спадний)
  private lookState: LOOKState = LOOKState.ASCENDING;

  // Перша черга запитів
  private firstQueue: Query[] = [];

  // Друга черга запитів
  private secondQueue: Query[] = [];

  // Конструктор класу
  // @param maxQueueSize Максимальний розмір черги запитів
  constructor(maxQueueSize: number) {
    this.maxQueueSize = maxQueueSize;
  }

  // Додає запит до черги
  // @param query Запит, який потрібно додати
  tryAddQueryToQueue(query: Query): void {
    switch (this.state) {
      case StateQueueActive.FIRST_QUEUE_ACTIVE:
        if (this.secondQueue.length === this.maxQueueSize / 2) {
          throw new QueueFullException();
        }
        this.secondQueue.push(query);
        break;

      case StateQueueActive.SECOND_QUEUE_ACTIVE:
        if (this.firstQueue.length === this.maxQueueSize / 2) {
          throw new QueueFullException();
        }
        this.firstQueue.push(query);
        break;
    }
  }

  // Вибирає наступний запит для обробки
  // @param currentDrivePosition Поточне положення головки диска
  // @returns Запит для обробки або null, якщо черга запитів порожня
  selectQuery(currentDrivePosition: number): Query | null {
    switch (this.state) {
      case StateQueueActive.FIRST_QUEUE_ACTIVE:
        if (this.firstQueue.length === 0) {
          this.state = StateQueueActive.SECOND_QUEUE_ACTIVE;
          return this.chooseLOOKQuery(
            currentDrivePosition,
            this.lookState,
            this.secondQueue
          );
        }
        return this.chooseLOOKQuery(
          currentDrivePosition,
          this.lookState,
          this.firstQueue
        );

      case StateQueueActive.SECOND_QUEUE_ACTIVE:
        if (this.secondQueue.length === 0) {
          this.state = StateQueueActive.FIRST_QUEUE_ACTIVE;
          return this.chooseLOOKQuery(
            currentDrivePosition,
            this.lookState,
            this.firstQueue
          );
        }
        return this.chooseLOOKQuery(
          currentDrivePosition,
          this.lookState,
          this.secondQueue
        );
    }
  }

  // Вибирає запит з черги відповідно до алгоритму LOOK
  // @param currentDrivePosition Поточне положення головки диска
  // @param state Напрямок пошуку (зростаючий або спадний)
  // @param queue Черга запитів
  // @returns Запит для обробки або null, якщо черга порожня
  private chooseLOOKQuery(
    currentDrivePosition: number,
    state: LOOKState,
    queue?: Query[]
  ): Query | null {
    if (queue?.length === 0) {
      return null;
    }

    switch (state) {
      case LOOKState.ASCENDING:
        const queryWithBiggerTrackNumber = queue
          .filter((q) => q.trackNumber >= currentDrivePosition)
          .reduce(
            (min, q) =>
              min === null ||
              q.trackNumber - currentDrivePosition <
                min.trackNumber - currentDrivePosition
                ? q
                : min,
            null
          );

        if (queryWithBiggerTrackNumber !== null) {
          queue.splice(queue.indexOf(queryWithBiggerTrackNumber), 1);
          return queryWithBiggerTrackNumber;
        } else {
          const queryToBeExecuted = queue.reduce(
            (max, q) =>
              max === null || q.trackNumber > max.trackNumber ? q : max,
            null
          );

          queue.splice(queue.indexOf(queryToBeExecuted), 1);

          this.lookState = LOOKState.DESCENDING;
          return queryToBeExecuted;
        }

      case LOOKState.DESCENDING:
        const queryWithSmallerTrackNumber = queue
          .filter((q) => q.trackNumber <= currentDrivePosition)
          .reduce(
            (min, q) =>
              min === null ||
              currentDrivePosition - q.trackNumber <
                currentDrivePosition - min.trackNumber
                ? q
                : min,
            null
          );

        if (queryWithSmallerTrackNumber !== null) {
          queue.splice(queue.indexOf(queryWithSmallerTrackNumber), 1);
          return queryWithSmallerTrackNumber;
        } else {
          const queryToBeExecuted = queue.reduce(
            (min, q) =>
              min === null || q.trackNumber < min.trackNumber ? q : min,
            null
          );

          queue.splice(queue.indexOf(queryToBeExecuted), 1);

          this.lookState = LOOKState.ASCENDING;
          return queryToBeExecuted;
        }
    }
  }
}