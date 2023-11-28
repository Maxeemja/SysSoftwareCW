import { Process } from './Process';
import { HardDrive } from './HardDrive';
import { Processor } from './Processor';
import MyController from './MyController';
import { CircularFLOOK, FIFO, SSTF } from './Algorithm';
import seedrandom from 'seedrandom';
import { Query } from './Query';
import { Algorithm, TypeFile } from '../shared';

// Константа яка відповідаж  кількості процесів у системі
const PROCESS_COUNT: number = 10;
// ймовірність запису в сусдній блок
const NEIGHBORING_BLOCK_WRITE_PROBABILITY: number = 0.3;
// кількість доріжок жорсткого диску
const TRACK_COUNT: number = 500;
// максимальна кількість запитів в секунду
const MAX_QUERIES_PER_SECOND: number = 20;
// лічильник виконаних запитів
export let completedQueriesCounter = 0;
export const queryCompletionTimes: Array<number> = [];

// кількість секторів на доріжчі
export const SECTORS_PER_TRACK = 100;
// максимальна кількість запитів до контроллера жорсткого диску
export const QUEUE_SIZE = 20;

// початкове заповнення стану доріжок жорсткого диску
// (використовується на сервері для відображення запонень доріжок)
const hardDriveTracks: boolean[][] = new Array(TRACK_COUNT)
  .fill(0)
  .map(() => new Array(SECTORS_PER_TRACK).fill(false));

// масив який містить в собі всі процеси
const processes: Process[] = [];
// перемінна яка відповідає за поточний блок файлу
// (необхідний для реалізації заповення доріжок)
let currentFileBlock = 0;
let globalTime = 0;

// метод для додання часу зачершення запиту використовується в контроллері
export function addQueryCompletionTime(time: number): void {
  queryCompletionTimes.push(time);
}

const arrayProsition: string[] = [];
// метод для збільшення лічильника виконаних запитів
export function incrementCompletedQueriesCounter(queryUnderExecution: Query) {
  arrayProsition.push(
    `${globalTime} ${Math.floor(
      queryUnderExecution.sectorNumber / SECTORS_PER_TRACK
    )}`
  );
  completedQueriesCounter++;
}

// у даній роботі для отримування одинакових випадкових значень
// при запуску програми варто використовувати зерно з бібліотеки seedrandom
export const seed = '2';
const rng = seedrandom(seed);

// метод для генерації випадковго цілого числа в певному проміжку
export function getRandomeInt(max: number): number {
  return Math.floor(rng() * max);
}

// отримання випадкового числа дробового
export function getRandom() {
  return rng();
}

// у даній роботі потрібно реалізувати експотенціальний розподіл запитів
// у моємо випадку роблю додатково 2 перевірки на переповнення стеку та
// отримане значення має бути > 1 для можливості отримати запит
export function getExponentiallyRandom(
  max: number,
  lambda: number = 2,
  minDepth: number = 0,
  maxDepth: number = 100
): number {
  const result = Math.floor(max - (Math.log(1 - getRandom()) / -lambda) * max);
  if (minDepth > maxDepth) {
    //обрблювати подію переповнення стеку
    return result;
  }

  return result < 1
    ? getExponentiallyRandom(max, lambda, minDepth + 1, maxDepth)
    : result;
}
// Ексорт змінної жорсткого диску для отримання всіх треків на вебі (index.ts)
export const hardDrive = new HardDrive(hardDriveTracks);
// Заготовки створення контроллера жорсткого диску відповідно до різних алгоритмів планування введення-виведення
// const hardDriveController = new MyController(hardDrive, new FIFO(QUEUE_SIZE))
// const hardDriveController = new MyController(hardDrive, new SSTF(QUEUE_SIZE))

export function main(algo: Algorithm, maxQty: number) {
  let hardDriveController = null;
  switch (algo) {
    case Algorithm.FSFC:
      hardDriveController = new MyController(hardDrive, new FIFO(QUEUE_SIZE));
      break;
    case Algorithm.SSTF:
      hardDriveController = new MyController(hardDrive, new SSTF(QUEUE_SIZE));
      break;
    case Algorithm.F_LOOK:
      hardDriveController = new MyController(
        hardDrive,
        new CircularFLOOK(QUEUE_SIZE)
      );
      break;
    default:
      return null;
  }

  for (let i = 0; i < PROCESS_COUNT; i++) {
    // отримання випадкового цілого числа
    const fileType = getRandomeInt(3);

    // зміна для вмісту розміру файлу
    let fileSize: number = 0;
    // відповідно до типу файлу виконується різні кейси TypeFile,
    // TypeFile є enum тому з легкістю можемо отримати enum member
    switch (fileType) {
      // невеликі файли до 10 блоків
      case TypeFile.SMALL:
        fileSize = getRandomeInt(10) + 1;
        break;
      // середні файли з розміром від 11 до 150 блоків
      case TypeFile.MEDIUM:
        fileSize = getRandomeInt(150 - 11 + 1) + 11;
        break;
      // великі файли з розміром від 151 до 500 блоків
      case TypeFile.LARGE:
        fileSize = getRandomeInt(500 - 151 + 1) + 151;
        break;
    }

    // констаннта для збереження блоків файлу
    const fileBlocks: number[] = [];

    // виконується створення блоків файлу
    for (let j = 0; j < fileSize; j++) {
      //Math.random()
      // виконується перевірка запису файлу в сусідній блок чи випадковий
      const recordInTheNeighboringBlock: boolean =
        getRandom() < NEIGHBORING_BLOCK_WRITE_PROBABILITY;
      const fileBlock = recordInTheNeighboringBlock
        ? currentFileBlock
        : currentFileBlock + 1;
      // оновлення номеру поточного блоку
      if (recordInTheNeighboringBlock) {
        currentFileBlock++;
      } else {
        currentFileBlock += 2;
      }
      // змінюємо стан блоку для відораження на диску як використаного
      hardDriveTracks[Math.floor(fileBlock / SECTORS_PER_TRACK)][
        fileBlock % SECTORS_PER_TRACK
      ] = true;
      // додання блоку до файлу
      fileBlocks.push(fileBlock);
    }
    // випадковий вибір із рівною можливістю чи файл використовується ише для читання
    const fileIsReadOnly: boolean = getRandomeInt(1) === 0;
    // створення процесу
    processes.push(
      new Process(
        { type: fileType, size: fileSize, blocks: fileBlocks },
        fileIsReadOnly,
        hardDriveController
      )
    );
  }

  // Створення об єкту процесора із максимальним числом запитів в секунду
  const processor = new Processor(processes, maxQty);

  while (completedQueriesCounter != 100000) {
    processor.step();
    hardDriveController.step();
    hardDrive.step();
    globalTime++;
  }
  const firstTwoHundredQueryCompletionTimes = queryCompletionTimes.splice(
    0,
    200
  );
  return firstTwoHundredQueryCompletionTimes;
}

// Створення процесів

// const path = __dirname.replace('modules', 'outputLogs/') + 'FLOOKHardDrivePosition.txt';

// fs.writeFile(path, `${firstTwoHundredQueryCompletionTimes.join('\n')}`, () => {});

// console.log(`Total completed queries: ${completedQueriesCounter}`);
// console.log(`Average: ${completedQueriesCounter / (processor.time / 1000)}`);
// console.log(`Execution time: ${globalTime}`);
