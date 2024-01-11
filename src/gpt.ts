import OpenAI from "openai"

import { Storage } from "@plasmohq/storage"

import { gptBaseUrl, gptSecretKey } from "~store/gpt"

export default async function openAIClient() {
  const sk = await gptSecretKey()
  const url = await gptBaseUrl()
  const client = new OpenAI({
    baseURL: url,
    apiKey: sk,
    dangerouslyAllowBrowser: true
  })
  return client
}
