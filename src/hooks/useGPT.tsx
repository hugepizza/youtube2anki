import { useAtomValue } from "jotai"
import { atomWithStorage } from "jotai/utils"
import OpenAI from "openai"

export const openAIEnable = atomWithStorage(
  "openAIEnable",
  "",
  window.localStorage,
  { getOnInit: true }
)

export const openAIBaseUrlAtom = atomWithStorage(
  "openAIBaseUrl",
  "",
  window.localStorage,
  { getOnInit: true }
)

export const openAISecretKeyAtom = atomWithStorage(
  "openAISecretKey",
  "",
  window.localStorage,
  { getOnInit: true }
)

export const openAIModelAtom = atomWithStorage(
  "openAIModel",
  "",
  window.localStorage,
  { getOnInit: true }
)

export const openAIPromptAtom = atomWithStorage(
  "openAIPromot",
  "",
  window.localStorage,
  { getOnInit: true }
)

export default function useGPT() {
  const sk = useAtomValue(openAISecretKeyAtom)
  const url = useAtomValue(openAIBaseUrlAtom)
  const modelName = useAtomValue(openAIModelAtom)
  const prompt = useAtomValue(openAIPromptAtom)
  const enable = useAtomValue(openAIEnable)
  const generateBack = async (front: string) => {
    if (enable === "") {
      return front
    }
    const client = new OpenAI({
      baseURL: url || undefined,
      apiKey: sk || "sk-",
      dangerouslyAllowBrowser: true
    })
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: prompt || "translate it to Chinese" },
        { role: "user", content: front }
      ],
      model: modelName || "gpt-3.5-turbo"
    })
    return chatCompletion.choices[0].message.content
  }
  return { generateBack }
}
