import clsx from "clsx";
import React from "react"

export default function InputWithKeyboardForModal() {

  // 判断command快捷键类型
  const isCommand = navigator.userAgent.indexOf('Macintosh') !== -1

  return (
    <div className={
      clsx(
        "cursor-pointer w-48 h-10 justify-end relative border  border-gray-300 flex items-center  rounded-md py-1.5 pr-14 shadow-sm",
        'hover hover:border-gray-400 hover:bg-gray-50 transform',
      )
    } onClick={() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', ctrlKey: true }));
    }}>
      <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
        <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400">
          {`${isCommand ? '⌘' : 'Ctrl'}E`}
        </kbd>
      </div>
    </div>
  )
}
