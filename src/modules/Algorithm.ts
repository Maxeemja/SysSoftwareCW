import { QuerySelAlgorithm, StateQueueActive } from '../shared';
import { SECTORS_PER_TRACK } from './Main';
import { Query, TypeQuery } from './Query';

// Інтерфейс для алгоритмів вибору запитів

// Виключення, яке сигналізує про переповнення черги
export class QueueFullException extends Error {}

// представлення необхідна для зміни черг
// у алгоритмі Circular F-LOOK для відрізняння черг


// Перший алгоритм який є досить легким в реалізації:
// FIFO (first input first output). Запити відправляються
// контролеру жорсткого диску відповідно до часу їхнього
// додавання до черги запитів.
export class FIFO implements QuerySelAlgorithm {
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
export class SSTF implements QuerySelAlgorithm {
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
      const distance = Math.abs(currentDrivePosition - Math.floor(query.sectorNumber / SECTORS_PER_TRACK));
      // Порівнюємо відстань від поточного положення до блока запиту з відстанню до блока найближчого запиту
      if (distance < Math.abs(currentDrivePosition - Math.floor(closest.sectorNumber / SECTORS_PER_TRACK))) {
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
export class CircularLOOK implements QuerySelAlgorithm {
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
      return Math.floor(query.sectorNumber / SECTORS_PER_TRACK) >= currentDrivePosition;
    });
    // якщо після фільтрування запити є виконуємо пошук для знаходження найблищого
    if (closestBiggerTrackQueryArray.length > 0) {
      closestBiggerTrackQuery = closestBiggerTrackQueryArray.reduce((closestBigger, query) => {
        const distance = Math.abs(currentDrivePosition - Math.floor(query.sectorNumber / SECTORS_PER_TRACK));
        if (distance < Math.abs(currentDrivePosition - Math.floor(closestBigger.sectorNumber / SECTORS_PER_TRACK))) {
          return query;
        }
        return closestBigger;
      });
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

// третій алгоритм Circular F-LOOK. Цей алгоритм схожий
// на алгоритм F-LOOK, але запити з кожної
// черги відправляються контролеру жорсткого
export class CircularFLOOK implements QuerySelAlgorithm {
  // перша черга алгоритму Circular LOOK
  private firstCircularLOOK: CircularLOOK;
  // друга черга алгоритму Circular LOOK
  private secondCircularLOOK: CircularLOOK;
  // стан необхідний для того щоб вказувати на активну чергу
  private state: StateQueueActive;

  constructor(maxQueueSize: number) {
    // особливість в тому, що загальну чергу ділимо на 2 рівні части та розподіляємо між чергами
    this.firstCircularLOOK = new CircularLOOK(Math.floor(maxQueueSize / 2));
    this.secondCircularLOOK = new CircularLOOK(Math.floor(maxQueueSize / 2));
    // початковий стан встановленний на активність першої черги
    this.state = StateQueueActive.FIRST_QUEUE;
  }

  // медод для додавання запиту до активної черги
  tryAddQueryToQueue(query: Query): void {
    // у блоці switch - case відповідно до того
    //яка доріжка обрана запити відправляються іншій
    switch (this.state) {
      // якщо перша черга додаємо запити до другої
      case StateQueueActive.FIRST_QUEUE:
        this.secondCircularLOOK.tryAddQueryToQueue(query);
        break;
      // та навпаки
      case StateQueueActive.SECOND_QUEUE:
        this.firstCircularLOOK.tryAddQueryToQueue(query);
        break;
    }
  }

  // Метод для вибору запиту для виконання
  selectQuery(currentDrivePosition: number): Query | null {
    switch (this.state) {
      // якщо перша черга порожня, змінюємо стан
      case StateQueueActive.FIRST_QUEUE:
        if (this.firstCircularLOOK.queue.length === 0) {
          this.state = StateQueueActive.SECOND_QUEUE;
          // вибір запиту із другої черги
          return this.secondCircularLOOK.selectQuery(currentDrivePosition);
        }
        // якщо черга не пуста вибираємо запит із першої черги
        return this.firstCircularLOOK.selectQuery(currentDrivePosition);
      // аналогічно до першого кейсу опиється друга черга
      case StateQueueActive.SECOND_QUEUE:
        if (this.secondCircularLOOK.queue.length === 0) {
          this.state = StateQueueActive.FIRST_QUEUE;
          return this.firstCircularLOOK.selectQuery(currentDrivePosition);
        }
        return this.secondCircularLOOK.selectQuery(currentDrivePosition);
    }
    return null;
  }
}



// // class for implementing the FLOOK algorithm
// export class FLOOK implements QuerySelAlgorithm {
//   // queue of queries
//   private queue: Query[];

//   // constructor
//   constructor() {
//     this.queue = [];
//   }

//   // method for adding a query to the queue
//   tryAddQueryToQueue(query: Query): void {
//     if (this.queue.length === this.queue.length) {
//       throw new QueueFullException();
//     }

//     this.queue.push(query);
//   }

//   // method for selecting a query for execution
//   selectQuery(currentDrivePosition: number): Query | null {
//     // check if the queue is empty
//     if (this.queue.length === 0) {
//       return null;
//     }

//     // get the first query on the current track
//     const firstQueryOnCurrentTrack = this.queue.find((query) => query.sectorNumber / SECTORS_PER_TRACK === currentDrivePosition);

//     // if there is a query on the current track, return it
//     if (firstQueryOnCurrentTrack !== undefined) {
//       return firstQueryOnCurrentTrack;
//     }

//     // otherwise, return the next query in the queue
//     return this.queue.shift();
//   }
// }

