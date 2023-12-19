export const baseUrl = "http://localhost:8765"

export async function ping() {
  try {
    await fetch(baseUrl, {
      method: "HEAD"
    })
  } catch (err) {
    throw err
  }
}
