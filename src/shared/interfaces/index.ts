import { Query } from "../../modules/Query";
import { TypeFile } from "../enums";

export interface RequestSelectionAlgorithm {
  // Метод для спроби додавання запиту до черги
  tryAddQueryToQueue(query: Query): void;
  // Метод для вибору запиту для виконання
  selectQuery(currentDrivePosition: number): Query | undefined | null;
}

export interface File {
  type: TypeFile,
  // розмір файлу
  size: number,
  // масив блоків
  blocks: number[],
}