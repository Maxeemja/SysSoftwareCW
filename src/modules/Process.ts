import { Controller } from './Controller';
import { Query, TypeQuery } from './Query';
import { QueryStyle, TypeFile, File, State } from '../shared';
import { getRandom, getRandomInt } from './utils';

// Позначає стан коли процес готується генерувати новиі запит
class CreatingQueryState extends State {}
// Позначає стан коли процес знаходиться в процесі обробки запиту
class ProcessingQueryState extends State {}
// Позначає стан коли процес створив запити і готовий його обробляти
class CreatedQueryState extends State {
  query: Query;

  constructor(query: Query) {
    super(1);
    this.query = query;
  }
}

export class Process {
  // Час для створення та обробки результату запиту
  static CREATION_QUERY_TIME = 7;
  static PROCESSING_QUERY_TIME = 7;

  public file: File;
  private readOnly: boolean;
  private hardDriveController: Controller;
  private lastQueriedBlockNumber: number;
  private queryStyle: QueryStyle;
  private state: State;

  // Дане поле відповідає чи може процес створювати нові запити до жорсткого диску
  public canCreateQueries = true;
  // Лічильник створених запитів
  public createdQueriesCounter: number = 0;

  constructor(
    file: File,
    readOnly: boolean,
    hardDriveController: Controller
  ) {
    // перевірка на існування файлу
    if (!file || !file.blocks || file.blocks.length === 0) {
      throw new Error('Invalid file provided');
    }
    this.file = file;
    this.readOnly = readOnly;
    this.hardDriveController = hardDriveController;
    this.lastQueriedBlockNumber = file.blocks[0];
    // встановлення стилю запиту відповідно до умови роботи:
    // Вірогідність запису блоку файлу дорівнює 50%. Процес звертається
    // до випадкових блоків файлу (невеликі, середні та великі файли) або послідовно до блоків
    // файлу, а в разі завершення файлу знову послідовно з початку (великі файли).
    this.queryStyle =
      file.type === TypeFile.LARGE
        ? getRandomInt(1) === 0
          ? QueryStyle.RANDOM
          : QueryStyle.SEQUENTIAL
        : QueryStyle.RANDOM;
    this.state = new CreatingQueryState(1);
  }

  // метод який використовується в процесорі на кожному такті
  step(): void {
    if (this.state instanceof CreatingQueryState) {
      // Випадок коли процес знаходиться в стані генерації запиту
      const progress = this.state.progress;
      if (progress === Process.CREATION_QUERY_TIME) {
        // випадкова ненерація типу запиту
        //Math.random() < 0.5
        const queryType = this.readOnly
          ? TypeQuery.READ
          : getRandomInt(1) === 0
          ? TypeQuery.READ
          : TypeQuery.WRITE;
        let sectorToQuery: number;
        // в залежності від стилю генерації запиту
        // визначаємо до якого номеру сектору буде здійснено запит
        if (this.queryStyle === QueryStyle.RANDOM) {
          //потрібно використовувати зерно
          //Math.random()
          sectorToQuery =
            this.file.blocks[Math.floor(getRandom() * this.file.blocks.length)];
        } else {
          sectorToQuery =
            this.file.blocks[
              (this.lastQueriedBlockNumber + 1) % this.file.blocks.length
            ];
        }
        // виконуємо перевизначення останього блоку
        this.lastQueriedBlockNumber = sectorToQuery;
        // створюємо новий запит в який передаємо 3 параметром даний процес який створив запит
        const query = new Query(queryType, sectorToQuery, this);
        // оновлюємо стан на заввреше створення
        this.state = new CreatedQueryState(query);
      } else {
        // продлвжуємо створення із збільшенням прогресу
        this.state = new CreatingQueryState(progress + 1);
      }
    } else if (this.state instanceof CreatedQueryState) {
      // можливий випадок коли процес не може створювати нові зпити
      if (!this.canCreateQueries) {
        // У такому випадку пропускаємо такт
        return;
      }
      try {
        // додання до черги запитів
        this.hardDriveController.addQueryToQueue(this.state.query);
        // Додати збілшення лічильника
        this.createdQueriesCounter++;
        // виконуємо створення нового запиту
        this.state = new CreatingQueryState(1);
      } catch (exception) {}
    } else if (this.state instanceof ProcessingQueryState) {
      // випадок коли процес знаходиться в стані обробки запиту
      const progress = this.state.progress;
      // перевірка на завершення обробки запиту
      if (progress === Process.PROCESSING_QUERY_TIME) {
        // виконуємо перехід до стану генерації нового запиту
        this.state = new CreatingQueryState(1);
      } else {
        // обробка не завершена продовжуємо із збільшенням прогресу
        this.state = new ProcessingQueryState(progress + 1);
      }
    }
  }
  provideTheQueryResult() {
    this.state = new ProcessingQueryState(1);
  }
}
