import { Button } from "antd";
import Menu from "antd/lib/menu";
import React, { useCallback, useEffect, useState } from "react";

const ContextMenu = () => {
    const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false)

    const handleContextMenu = useCallback((e: any) => {
        e.preventDefault()
        setMenuAnchor({ x: e.pageX, y: e.pageY })
        setVisible(true)
        console.log("context menu", e)
    }, [])

    const handleOutsideClick = useCallback((e: any) => {
        setVisible(false)
    }, [])

    useEffect(() => {
        document.addEventListener("contextmenu", handleContextMenu)
        document.addEventListener("click", handleOutsideClick)

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu)
            document.removeEventListener("click", handleOutsideClick)
        }
    }, [])

    return (
        <>
            {visible &&
                <>
                    <Menu
                        style={{
                            position: "absolute",
                            top: menuAnchor.y,
                            left: menuAnchor.x,
                            zIndex: 9999
                        }}
                    >
                        <Menu.Item>Copy</Menu.Item>
                        <Menu.Item>Cut</Menu.Item>
                        <Menu.Item disabled>Paste</Menu.Item>
                        <Menu.SubMenu title={"Insert..."}>
                            <Menu.Item>Rectangle</Menu.Item>
                            <Menu.Item>Text</Menu.Item>
                        </Menu.SubMenu>
                    </Menu>
                </>
            }
        </>
    )

}

export { ContextMenu }