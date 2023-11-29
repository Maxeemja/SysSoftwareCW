
export class HardDrive {
  // Час який потрібно для переміщення на одну доріжу механізму приводу
  static TIME_PER_TRACK = 10;
  // Час затримки обертання
  static ROTATION_DELAY_TIME = 8;
  static MOVEMENT_TIME_BETWEEN_TRACKS = 130;

  // Доріжки жорсткого диску
  tracks: boolean[][];
  // Час переміщення на одну доріжку механізму приводу
  private timePerTrack: number;
  // Час затримки обертання
  private rotationDelayTime: number;
  // Стан жорсткого диску який може бути у формі Idle Moving  Waiting Rotation
  state: StateHardDrive;
  // номер треку
  trackNumber: number = 0;

  // ініціалізація полів жорсткого диску
  constructor(
    tracks: boolean[][],
    timePerTrack: number = HardDrive.TIME_PER_TRACK,
    rotationDelayTime: number = HardDrive.ROTATION_DELAY_TIME,
    _movementTimeBetweenTracks: number = HardDrive.MOVEMENT_TIME_BETWEEN_TRACKS,
  ) {
    this.tracks = tracks;
    this.timePerTrack = timePerTrack;
    this.rotationDelayTime = rotationDelayTime;
    this.state = StateHardDrive.Idle(0, false);
  }
  // Виконуємо операцію на поточному секторі
  performAnOperationOnCurrentSector = () => {
    // якщо стан простою (IDLE) та значення готовності диску true
    if (this.state instanceof Idle && (<Idle>this.state).isReady) {
      // Оновлюємо стан та встановлюємо значення готовності false
      this.state = new Idle(this.state.position, false);
    } else {
      // У випадку якщо операцію неможливо виконати, коли диск не готовий
      throw new Error('The operation cannot be performed if the disk is not ready!');
    }
  };

  // Метод для отримання всіх треків жорсткого диску
  getTracks() {
    return this.tracks;
  }
  // Метод для відображення всіх треків жорсткого диску у консоль програми
  displayTracks() {
    const formattedTracks = this.tracks.map((track, indexTrack) => {
      const formattedSectors = track
        .map((sector, indexSector) => {
          const separator = (indexSector + 1) % 10 === 0 ? '\n' : ' ';
          return `${indexSector}:${sector}${separator}`;
        })
        .join('');

      return `Track №${indexTrack}:\n${'-'.repeat(80)}\n${'|'}${formattedSectors}${'|'}\n${'-'.repeat(80)}`;
    });

    return formattedTracks.join('\n');
  }
  // Метод для відображення перших 50 треків
  displayFirstFiftyTracks() {
    const formattedTracks = this.tracks.slice(0, 50).map((track, indexTrack) => {
      const formattedSectors = track
        .map((sector, indexSector) => {
          const separator = (indexSector + 1) % 10 === 0 ? '\n' : ' ';
          return `${indexSector}:${sector}${separator}`;
        })
        .join('');

      return `Track №${indexTrack}:\n${'-'.repeat(80)}\n${'|'}${formattedSectors}${'|'}\n${'-'.repeat(80)}`;
    });
    return formattedTracks.join('\n');
  }
  // Переміщення приводу механізму до заданої позиції
  moveDriveTo(targetPosition: number): void {
    // Перевірка, чи поточна позиція є кінцевою
    if (this.state.position === targetPosition) {
      // Якщо умова підходить змінюємо стан на режим очікування обертання
      this.state = StateHardDrive.WaitingRotation(this.state.position, 1);
    } else {
      // В іншому випадку виконуємо переміщення
      this.state = StateHardDrive.Moving(this.state.position, targetPosition, 1);
    }
  }

  // Імітація плинності для обробки кожної секунди кроку (викликається в main.ts)
  step(): void {

    // Виконуємо перевірку стану жорсткого диску
    // Якщо пристрій знаходиться в стані очікування
    if (this.state instanceof WaitingRotation) {
      // За допомогою касту (<WaitingRotation>this.state)
      // явно вказуємо тип стану потрібне для отримання значення прогресу
      const progress = (<WaitingRotation>this.state).progress;
      // Виконується перевірка чи прогрес рівний часу затримки обертання
      if (progress === this.rotationDelayTime) {
        // Змінюємо стан жорсткого диску на Idle також важливо
        // передати значення isReady true що вкаже що диск готовий для рооботи
        this.state = StateHardDrive.Idle(this.state.position, true);
      } else {
        // В іншому випадку продовжуємо очікувати але інкрементуємо час прогресу
        this.state = StateHardDrive.WaitingRotation(this.state.position, progress + 1);
      }
    }
    // Якщо пристрій знаходиться в стані руху (переміщення)
    if (this.state instanceof Moving) {
      // кількість часу в процесі руху до цільової позиції
      const progress = (<Moving>this.state).progress;
      // Цільова позиція
      const targetPosition = (<Moving>this.state).targetPosition;

      // перевірка досягання кінцевої позиції
      if (this.state.position === targetPosition) {
        // після досягнення позиції переходимо в стан очікування та виходимо із даного блоку
        this.state = StateHardDrive.WaitingRotation(this.state.position, 1);
        return;
      }

      // перевірка часу прогресу із часом який потрібний для руху на одну доріжку
      if (progress === this.timePerTrack) {
        // Якщо поточна позиція більша за цільову,
        // ми рухаємося вгору (зменшуємо позицію), в іншому випадку рухаємося вниз
        // (збільшуємо позицію).
        if (this.state.position > targetPosition) {
          this.state = StateHardDrive.Moving(this.state.position - 1, targetPosition, 1);
        } else {
          this.state = StateHardDrive.Moving(this.state.position + 1, targetPosition, 1);
        }
      } else {
        // якщо умова не виконана продовжуємо переміщення із збільшенням часу (прогресу на 1 крок)
        this.state = StateHardDrive.Moving(this.state.position, targetPosition, progress + 1);
      }
    }
    // Якщо пристрій знаходиться в стані простою
    if (this.state instanceof Idle) {
      // варто перевіряти на готовність диску, якщо він не готовий
      if (!(<Idle>this.state).isReady) {
        // Виконуємо переведення стану в режим очікування обертання
        this.state = StateHardDrive.WaitingRotation(this.state.position, 1);
      }
    }
  }
}

// у даній роботі реалізацію станів жорсткого диску виконую через представленя різних класів,
// в якій може перебувати жорсткий диск.
// Абскрактний клас в якому реалізований конструктор
// для приймання позиції механізму приводу
export abstract class StateHardDrive {
  constructor(public position: number) {}
  // В даному класі існує 3 метода для створення нових обєктів класу
  static Idle(position: number, isReady: boolean): Idle {
    return new Idle(position, isReady);
  }
  static Moving(position: number, targetPosition: number, progress: number): Moving {
    return new Moving(position, targetPosition, progress);
  }

  static WaitingRotation(position: number, progress: number) {
    return new WaitingRotation(position, progress);
  }
}
// обява дочірних класів класу StateHardDrive
// 1) Даний клас є клас стану простою який приймає механізму
// приводу та стан готовності механізму приводу
export class Idle extends StateHardDrive {
  constructor(
    public override position: number,
    public isReady: boolean,
  ) {
    super(position);
  }
}
// 2)  Даний клас є клас стану руху із вказаною поточною та кінцевою позицією
// приймає поточну та ціловю позицію в конструкторі та прогрес
class Moving extends StateHardDrive {
  constructor(
    public override position: number,
    public targetPosition: number,
    public progress: number,
  ) {
    super(position);
  }
}
// 3)  Даний клас є клас стану очікування обертання
// приймає поточну позицію та прогрес очікування обертання
class WaitingRotation extends StateHardDrive {
  constructor(
    public override position: number,
    public progress: number,
  ) {
    super(position);
  }
}
