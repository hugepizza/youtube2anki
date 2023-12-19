import "./style.css"

import { useAtom } from "jotai"

import About from "~components/About"
import Home from "~components/Home"
import { Menu, menuActiveAtom } from "~components/Menu"

function IndexPopup() {
  const [menuActive] = useAtom(menuActiveAtom)
  return (
    <div className="w-[600px] max-w-[600px] flex flex-row text-base">
      <Menu />
      <div className="flex flex-grow w-full">
        {menuActive === "home" && <Home />}
        {/* {menuActive === "setting" && <Setting />} */}
        {menuActive === "about" && <About />}
      </div>
    </div>
  )
}

export default IndexPopup
