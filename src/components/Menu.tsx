import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { Home, Info } from "lucide-react"

import { Button } from "./ui/button"

export const menuActiveAtom = atomWithStorage(
  "menuActive",
  "",
  window.localStorage,
  {
    getOnInit: true
  }
)

const menuItems = [
  {
    id: "home",
    svg: <Home className="w-6 h-6" strokeWidth={2} />
  },
  {
    id: "about",
    svg: <Info className="w-6 h-6" strokeWidth={2} />
  }
]
export function Menu() {
  const [menuActive, setMenuActive] = useAtom(menuActiveAtom)
  return (
    <div>
      <ul className="bg-base-200 rounded-box h-full justify-start space-y-1">
        {menuItems.map((ele) => (
          <li key={ele.id}>
            <Button
              variant={
                (menuActive === null ? "home" : menuActive) === ele.id
                  ? "default"
                  : "ghost"
              }
              onClick={() => setMenuActive(ele.id)}>
              {ele.svg}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
