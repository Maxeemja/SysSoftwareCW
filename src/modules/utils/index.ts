import seedrandom from 'seedrandom';
import { queryCompletionTimes } from '../Main';

// генерація рандомних чисел
export const seed = '2';
const range = seedrandom(seed);

// метод для генерації випадковго цілого числа в певному проміжку
export function getRandomInt(max: number): number {
  return Math.floor(range() * max);
}

// отримання випадкового дробового числа
export function getRandom() {
  return range();
}

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

// метод для додання часу зачершення запиту використовується в контроллері
export function addQueryCompletionTime(time: number): void {
  queryCompletionTimes.push(time);
}
