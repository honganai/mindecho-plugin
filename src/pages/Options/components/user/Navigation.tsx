import React, { useContext } from 'react';
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { remToPx } from '@/lib/remToPx'
import GlobalContext, { ActionType, NavigationMap } from '@/reducer/global'

function VisibleSectionHighlight() {
  const { state: globalState } = useContext(GlobalContext);
  const { nav } = globalState;

  const itemHeight = remToPx(2.5)
  const height = itemHeight
  const top =
    NavigationMap.findIndex((item) => item.action === nav) * itemHeight

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.2 } }}
      exit={{ opacity: 0 }}
      className="absolute inset-x-0 top-0  z-0 bg-gray-200 will-change-transform"
      style={{ borderRadius: 8, height, top, right: `-12px` }}
    />
  )
}

function ActivePageMarker() {
  const { state: globalState } = useContext(GlobalContext);
  const { nav } = globalState;

  const itemHeight = remToPx(2.5)
  const offset = remToPx(0.5)
  const activePageIndex = NavigationMap.findIndex((item) => item.action === nav)
  const top = offset + activePageIndex * itemHeight

  return (
    <motion.div
      layout
      className="absolute h-6 border-r-2 border-sky-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.2 } }}
      exit={{ opacity: 0 }}
      style={{ top, right: '-2px' }}
    />
  )
}

function NavigationGroup() {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { nav } = globalState;

  if (!nav) {
    globalDispatch({ type: ActionType.SetNav, payload: NavigationMap[0].action })
  }

  return (
    <motion.ul
      role="list"
      style={{ marginLeft: remToPx(1) }}
      className={
        clsx(
          'border-r border-zinc-500',
          'basis-1/4 box-content w-200 relative',
        )
      }
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { delay: 0.1 },
      }}
      exit={{
        opacity: 0,
        transition: { duration: 0.15 },
      }}
    >
      <AnimatePresence>
        <VisibleSectionHighlight />
      </AnimatePresence>
      <AnimatePresence>
        <ActivePageMarker />
      </AnimatePresence>
      {NavigationMap.map((item) => (
        <li className={
          clsx(
            'z-10 relative cursor-pointer flex justify-between m-0 gap-2 py-1 pr-3 text-sm transition pl-4 leading-8',
            nav === item.action
              ? 'text-sky-600'
              : 'text-gray-600 hover:text-gray-700',
          )
        }
          key={item.action}
          onClick={() => globalDispatch(
            { type: ActionType.SetNav, payload: item.action }
          )}>
          {item.title}
        </li>
      ))}
    </motion.ul>)
}

export function Navigation() {
  return (
    <NavigationGroup />
  )
}
