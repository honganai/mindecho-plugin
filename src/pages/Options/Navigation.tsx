import React, { useContext } from 'react';
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { remToPx } from '@/lib/remToPx'
import GlobalContext, { ActionType, NavigationMap } from '@/reducer/global'
import { Bookshelf, SettingTwo } from '@icon-park/react';
import EmailIcon from '@/assets/icons/image 32.png';
import DiscordIcon from '@/assets/icons/image 31.png';

import { Avatar } from './components/catalyst/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from './components/catalyst/dropdown'
import {
  SidebarItem,
} from './components/catalyst/sidebar'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
} from '@heroicons/react/16/solid'


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
      style={{ borderRadius: 8, height, top, right: 0 }}
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

export function Navigation() {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { nav, userInfo } = globalState;
  const { getMessage: t } = chrome.i18n;

  if (!nav) {
    globalDispatch({ type: ActionType.SetNav, payload: NavigationMap[0].action })
  }

  return (
    <div className={clsx(
      'border-r border-gray-200',
      `flex flex-col w-64`,
    )}>
      <motion.ul
        role="list"
        style={{ marginLeft: remToPx(1) }}
        className={
          clsx(
            `flex-1 h-0`,
            'box-content relative',
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

        {NavigationMap.map((item) => {
          const isAction = nav === item.action
          return <li className={
            clsx(
              'items-center z-10 relative cursor-pointer flex m-0 gap-2 py-1 pr-3 text-sm transition pl-4 leading-8',
            )
          }
            key={item.action}
            onClick={() => globalDispatch(
              { type: ActionType.SetNav, payload: item.action }
            )}>

            <AnimatePresence>
              {(() => {
                switch (item.action) {
                  case 'collection':
                    return <Bookshelf theme="outline" size="20" fill={isAction ? "#23a1fb" : '#3e3e3e'} />

                  case 'manageSources':
                    return <SettingTwo theme="outline" size="20" fill={isAction ? '#23a1fb' : '#3e3e3e'} />
                }
              })()}
            </AnimatePresence>

            <span className={
              clsx(
                'ml-2',
                isAction
                  ? 'text-sky-600'
                  : 'text-gray-600 hover:text-gray-700',
              )
            }>
              {t(item.title)}
            </span>
          </li>
        })}
      </motion.ul >

      <div className='flex justify-center gap-4 pb-10 flex-wrap'>
        <span className="w-full text-lg text-center text-gray-900 text-bold">{t('questions')}</span>

        <img
          className="h-6 cursor-pointer hover:scale-105 transition"
          src={EmailIcon}
          alt="EmailIcon"
          onClick={() => window.open('mailto:Echo@linnk.ai')}
        />
        <img
          className="h-6 cursor-pointer hover:scale-105 transition"
          src={DiscordIcon}
          alt="DiscordIcon"
          onClick={() => window.open('https://discord.gg/xhMtr2Ynj4')}
        />
      </div>

      <AnimatePresence>
        {
          userInfo && <div className="p-4">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar src="https://picsum.photos/200" className="size-10" square alt="" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                      {userInfo.username || ''}
                    </span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      {userInfo.email || ''}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-56" anchor="top start">
                <DropdownItem href="/logout">
                  <ArrowRightStartOnRectangleIcon />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        }
      </AnimatePresence>
    </div>)
}
