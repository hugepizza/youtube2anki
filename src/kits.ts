import { parseStringPromise } from "xml2js"

export async function parseXML(xmlString: string) {
  const xmlDoc = await parseStringPromise(xmlString)
  const texts = xmlDoc?.transcript?.text || []
  const captions = texts.map((text) => ({
    start: parseInt(text.$.start, 10),
    duration: text.$.dur,
    content: text._.replaceAll("&#39;", "'")
  }))
  return captions
}
