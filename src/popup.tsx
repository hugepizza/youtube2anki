import { Home } from "lucide-react"

import "./style.css"

import { useAtom } from "jotai"

import About from "~components/About"
import { Menu, menuActiveAtom } from "~components/Menu"
import Setting from "~components/Setting"

function IndexPopup() {
  const [menuActive] = useAtom(menuActiveAtom)
  return (
    <div className="w-[600px] max-w-[600px] flex flex-row text-base p-2 shadow-lg">
      <Menu />
      <div className="flex flex-grow w-full">
        {(menuActive === "home" || menuActive === null) && <Setting />}
        {menuActive === "about" && <About />}
        {menuActive === "setting" && <Setting />}
      </div>
    </div>
  )
}

export default IndexPopup
