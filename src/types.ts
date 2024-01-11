export enum MessageAction {
  TaskResult = "TaskResult",
  AddCard = "AddCard",
  AddComplatedCard = "AddComplatedCard",
  AdjustProgress = "adjustProgress",
  CaptionUrl = "captionUrl"
}

export type caption = {
  start: number
  duration: string
  content: string
}

export type Task = {
  action: string
  front: string
  back?: string
}
export type TaskResult = {
  action: string
  result: string
  message: string
  taskCount: number
}
