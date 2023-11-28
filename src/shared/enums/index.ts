export enum TypeQuery {
  READ,
  WRITE,
}

export enum StateQueueActive {
  FIRST_QUEUE_ACTIVE,
  SECOND_QUEUE_ACTIVE,
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
  FIFO = 'FIFO',
  SSTF = 'SSTF',
  F_LOOK = 'F-LOOK',
}

export enum LOOKState {
  ASCENDING,
  DESCENDING,
}

