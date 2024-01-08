import * as crypto from "crypto"

import { baseUrl } from "./_index"

export async function storeMediaFileByData(data: Buffer) {
  const fname = crypto.randomBytes(16).toString("base64") + ".mp3"

  const base64String: string = data.toString("base64")
  await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "storeMediaFile",
      version: 6,
      params: {
        filename: fname,
        data: base64String
      }
    })
  })
  return fname
}
