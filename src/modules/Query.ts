import { TypeQuery } from '../shared';
import { Process } from './Process';
// Запити можуть бути двох типів читання та запису із однаков шансом

// Клас для створення запиту
export class Query {
  // тпи запиту
  type: TypeQuery;
  // номер сектора для читання чи запису на жорсткий диск
  sectorNumber: number;
  // опційний параметр, що вказує який процес надав запит
  process?: Process;
  trackNumber?: number;

  // Конструктор для ініціалізації данних
  constructor(type: TypeQuery, sectorNumber: number, process?: Process) {
    this.process = process;
    this.type = type;
    this.sectorNumber = sectorNumber;
  }
}
export { TypeQuery };

