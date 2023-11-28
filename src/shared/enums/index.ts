export enum TypeQuery {
  READ,
  WRITE,
}

export enum StateQueueActive {
  FIRST_QUEUE,
  SECOND_QUEUE,
}

export enum HardDriveState {
  DOWNTIME,
  MOVING,
}

// Можливі варіанти типу файлу
export enum TypeFile {
  SMALL,
  MEDIUM,
  LARGE,
}

// типи запитів
export enum QueryStyle {
  RANDOM,
  SEQUENTIAL,
}

export enum Algorithm {
  FSFC = 'FSFC',
  SSTF = 'SSTF',
  F_LOOK = 'F-LOOK',
}
