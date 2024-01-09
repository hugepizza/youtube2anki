export enum MessageAction {
  TaskResult = "TaskResult",
  AddCard = "AddCard",
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
  data: string
}
export type TaskResult = {
  action: string
  result: string
  message: string
  taskCount: number
}
