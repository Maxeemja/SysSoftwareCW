import { Process } from './Process';
import { HardDrive } from './HardDrive';
import { Processor } from './Processor';
import { MyController } from './MyController';
import { CircularFLOOK, FIFO, SSTF } from './Algorithm';
import { Query } from './Query';
import { Algorithm, TypeFile } from '../shared';
import { getRandom, getRandomInt } from './utils';

// Константа яка відповідаж  кількості процесів у системі
const PROCESS_COUNT: number = 10;
// ймовірність запису в сусдній блок
const NEIGHBORING_BLOCK_WRITE_PROBABILITY: number = 0.3;
// кількість доріжок жорсткого диску
const TRACK_COUNT: number = 500;
// лічильник виконаних запитів
export let completedQueriesCounter = 0;

export const queryCompletionTimes: Array<number> = [];

// кількість секторів на доріжці
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

export const arrayOfPositions: string[] = [];
// метод для збільшення лічильника виконаних запитів
export function incrementCompletedQueriesCounter(queryUnderExecution: Query) {
  arrayOfPositions.push(
    `${globalTime} ${Math.floor(
      queryUnderExecution.sectorNumber / SECTORS_PER_TRACK
    )}`
  );
  completedQueriesCounter++;
}

export function getCalculations(algo: Algorithm, maxQty: number) {
  const hardDrive = new HardDrive(hardDriveTracks);
  let hardDriveController = null;

  switch (algo) {
    case Algorithm.FIFO:
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
    const fileType = getRandomInt(3);

    // зміна для вмісту розміру файлу
    let fileSize: number = 0;
    // відповідно до типу файлу виконується різні кейси TypeFile,
    // TypeFile є enum тому з легкістю можемо отримати enum member
    switch (fileType) {
      // невеликі файли до 10 блоків
      case TypeFile.SMALL:
        fileSize = getRandomInt(10) + 1;
        break;
      // середні файли з розміром від 11 до 150 блоків
      case TypeFile.MEDIUM:
        fileSize = getRandomInt(150 - 11 + 1) + 11;
        break;
      // великі файли з розміром від 151 до 500 блоків
      case TypeFile.LARGE:
        fileSize = getRandomInt(500 - 151 + 1) + 151;
        break;
    }

    // констаннта для збереження блоків файлу
    const fileBlocks: number[] = [];

    // виконується створення блоків файлу
    for (let j = 0; j < fileSize; j++) {
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
    const fileIsReadOnly: boolean = getRandomInt(1) === 0;
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

  console.log(`Total completed queries: ${completedQueriesCounter}`);
  console.log(`Average: ${completedQueriesCounter / (processor.time / 1000)}`);
  console.log(`Execution time: ${globalTime}`);

  // chart data formation
  const data1 = {
    xData: [],
    yData: [],
  };

  arrayOfPositions.slice(0, 200).map((el) => {
    const tempArr = el.split(' ');
    data1.xData.push(tempArr[0]);
    data1.yData.push(tempArr[1]);
  });

  const data2 = {
    xData: [],
    yData: [],
  };

  queryCompletionTimes.splice(0, 200).map((el) => {
    data2.yData.push(el);
  });

  data2.xData = Array(200)
    .fill(0)
    .map((_, i) => i + 1);

  return [data1, data2];
}
