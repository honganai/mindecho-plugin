import React from "react"

export default function InputWithKeyboardForModal() {

  // 判断command快捷键类型
  const isCommand = navigator.userAgent.indexOf('Macintosh') !== -1

  return (
    <div className="relative flex items-center" onClick={() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', ctrlKey: true }));
    }}>
      <input
        type="text"
        name="search"
        id="search"
        className="leading-8 block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
      <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
        <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400">
          {`${isCommand ? '⌘' : 'Ctrl'}E`}
        </kbd>
      </div>
    </div>
  )
}
