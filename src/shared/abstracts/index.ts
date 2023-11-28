// клас state виступає абстрактним класом та визначає загальну
// властивість для всіх дочірніх станів (прогрес)
export abstract class State {
  public progress: number;

  constructor(progress: number) {
    this.progress = progress;
  }
}
