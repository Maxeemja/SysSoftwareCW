import { RequestSelectionAlgorithm, StateQueueActive } from '../shared';
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

  selectQuery(currentDrivePosition: number): Query | null {
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

// Проміжний алгоритм необхідний для реалізації Circular F-LOOK.
// так як в нас розбивається черга на дві
// але запити з кожної черги відправляються контролеру жорсткого
// диску відповідно до алгоритм Circular LOOK.
// Алгоритм Circular LOOK. Цей алгоритм схожий на алгоритм LOOK,
//але запити відправляються контролеру жорсткого диску тільки в
//порядку зростання номерів доріжок. Коли вже нема запитів
// із більшими номерами доріжок, відправляється запит переміщення
// до першої доріжки й надсилаються нові запити.
export class CircularLOOK implements RequestSelectionAlgorithm {
  // максимальний розмір черги
  private maxQueueSize: number;
  // черга яка формується як масив запитів
  public queue: Query[];

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

  selectQuery(currentDrivePosition: number): Query | null {
    // змінна для найблищого більшого запиту
    let closestBiggerTrackQuery: Query | null = null;
    // перевірка на порожню чергу
    if (this.queue.length === 0) {
      // якщо черга порожня вертаємо null
      return null;
    }
    // Фиконуємо фільтрацію запитів які знаходяться на треках більших або рівних поточному
    const closestBiggerTrackQueryArray = this.queue.filter((query) => {
      return (
        Math.floor(query.sectorNumber / SECTORS_PER_TRACK) >=
        currentDrivePosition
      );
    });
    // якщо після фільтрування запити є виконуємо пошук для знаходження найблищого
    if (closestBiggerTrackQueryArray.length > 0) {
      closestBiggerTrackQuery = closestBiggerTrackQueryArray.reduce(
        (closestBigger, query) => {
          const distance = Math.abs(
            currentDrivePosition -
              Math.floor(query.sectorNumber / SECTORS_PER_TRACK)
          );
          if (
            distance <
            Math.abs(
              currentDrivePosition -
                Math.floor(closestBigger.sectorNumber / SECTORS_PER_TRACK)
            )
          ) {
            return query;
          }
          return closestBigger;
        }
      );
    }
    // якщо запиту не знайдено відповідно до алгоритму повертаємося на першу позицію
    if (closestBiggerTrackQuery === null) {
      // переміщення на першу позицію
      return new Query(TypeQuery.WRITE, 0, undefined);
    } else {
      // знаходження індексу запиту в черзі
      const index = this.queue.indexOf(closestBiggerTrackQuery);
      if (index !== -1) {
        // якщо елемент знайдено, видаляємо його за допомогою splice
        this.queue.splice(index, 1);
      }
      // повертаємо обраний запит
      return closestBiggerTrackQuery;
    }
  }
}

// третій алгоритм  FLOOK
export class FLOOK implements RequestSelectionAlgorithm {
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

  selectQuery(currentDrivePosition: number): Query | null {
    // Перевірка чи черга пуста
    if (this.queue.length === 0) {
      // якщо черга пуста вертаємо null
      return null;
    }

    // Знаходження найближчого запиту до поточного
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
