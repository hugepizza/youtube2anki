import { useAtom } from "jotai"

import {
  openAIBaseUrlAtom,
  openAIEnable,
  openAIModelAtom,
  openAIPromptAtom,
  openAISecretKeyAtom
} from "~hooks/useGPT"

export default function Setting() {
  const [sk, setSk] = useAtom(openAISecretKeyAtom)
  const [url, setUrl] = useAtom(openAIBaseUrlAtom)
  const [modelName, setModelName] = useAtom(openAIModelAtom)
  const [prompt, setPrompt] = useAtom(openAIPromptAtom)
  const [enable, setEnable] = useAtom(openAIEnable)

  return (
    <div className="w-full p-4 flex flex-col">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="checkbox"
          onChange={(e) => {
            setEnable(e.currentTarget.checked === true ? "true" : "")
          }}
          checked={enable === "true"}
        />
        <span className="pl-2 select-none">
          Use ChatGPT go generate card back
        </span>
      </label>
      <div
        className={`flex flex-col space-y-1 ${
          enable === "true" ? "" : "hidden"
        }`}>
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">Base URL</span>
          <input
            className="input input-bordered input-sm"
            placeholder="https://api.example.com/v1"
            type="text"
            onChange={(e) => setUrl(e.currentTarget.value)}
            value={url}></input>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">* Secret Key</span>
          <input
            className="input input-bordered input-sm"
            placeholder="sk-xxx"
            type="text"
            onChange={(e) => setSk(e.currentTarget.value)}
            value={sk}></input>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">Modal</span>
          <select
            className="select select-bordered w-full select-sm"
            defaultValue={modelName}
            onChange={(e) => setModelName(e.target.value)}>
            <option>gpt-3.5-turbo</option>
            <option>gpt-4</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">Custom Prompt</span>
          <textarea
            className="textarea textarea-bordered"
            placeholder="translate it to Chinese"
            onChange={(e) => setPrompt(e.currentTarget.value)}
            value={prompt}></textarea>
        </div>
      </div>
    </div>
  )
}
