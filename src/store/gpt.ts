import { Storage } from "@plasmohq/storage"

const storage = new Storage({ area: "local" })
export async function gptEnable() {
  const v = (await storage.getItem("gpt-enable")) === "true"
  console.log("gpt-enable ", v)
  return v
}

export async function gptAutoBackAudio() {
  const v = (await storage.getItem("gpt-audio")) === "true"
  console.log("gpt-audio ", v)
  return v
}

export async function gptAutoBackPrompt() {
  const v = (await storage.getItem("gpt-modelName")) || "gpt-3.5-turbo"
  console.log("gpt-modelName ", v)
  return v
}

export async function gptSecretKey() {
  const v = (await storage.getItem("gpt-sk")) || "sk-"
  console.log("gpt-sk ", v)
  return v
}

export async function gptBaseUrl(): Promise<string | undefined> {
  const v = (await storage.getItem("gpt-url")) || undefined
  console.log("gpt-url ", v)
  return v
}

export async function gptModel() {
  const v = (await storage.getItem("gpt-modelName")) || "gpt-3.5-turbo"
  console.log("gpt-modelName ", v)
  return v
}

export async function gptPrompt() {
  const v =
    (await storage.getItem("gpt-prompt")) ||
    "将我给出的句子翻译成中文，只要给我翻译结果，不要有任何多余信息"
  console.log("gpt-prompt ", v)
  return v
}

export async function gptTranslatePrompt() {
  const v =
    (await storage.getItem("gpt-translate-prompt")) ||
    "将我给出的句子翻译成中文，只要给我翻译结果，不要有任何多余信息"
  console.log("gpt-translate-prompt ", v)
  return v
}

export async function setGPTEnable(v: boolean) {
  storage.setItem("gpt-enable", v ? "true" : "")
}

export async function setGPTAutoBackAudio(v: boolean) {
  storage.setItem("gpt-audio", v ? "true" : "")
}

export async function setGPTAutoBackPrompt(v: string) {
  storage.setItem("gpt-modelName", v)
}

export async function setGPTSecretKey(v: string) {
  storage.setItem("gpt-sk", v)
}

export async function setGPTBaseUrl(v: string) {
  storage.setItem("gpt-url", v)
}

export async function setGPTModel(v: string) {
  storage.setItem("gpt-modelName", v)
}

export async function setGPTPrompt(v: string) {
  storage.setItem("gpt-prompt", v)
}

export async function setGPTTranslatePrompt(v: string) {
  storage.setItem("gpt-translate-prompt", v)
}
