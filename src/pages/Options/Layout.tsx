import React, { useContext } from 'react'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/pages/Options/components/catalyst/dropdown'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/pages/Options/components/catalyst/sidebar'
import { SidebarLayout } from '@/pages/Options/components/catalyst/sidebar-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
} from '@heroicons/react/16/solid'
import { useLocation, useNavigate } from 'react-router-dom'
import { handleLogin } from '@/utils/common.util';

import EmailIcon from '@/assets/icons/image 32.png';
import DiscordIcon from '@/assets/icons/image 31.png';

import Header from './components/header/header';
import GlobalContext, { ActionType, NavigationMap } from '@/reducer/global'
import Avatar from 'react-avatar';

function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="#">
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Sign out</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  )
}

const { getMessage: t } = chrome.i18n;

export function ApplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { nav, userInfo } = globalState;
  const navigate = useNavigate()
  const { pathname } = useLocation()
  handleLogin(
    (res: any) => {
      console.log("🚀 ~ res:", res)

    },
    //如果没有登录，则等用户点击登陆按钮
    () => {
    }
  );
  return (
    <SidebarLayout
      navbar={<></>}
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Header />
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              {
                NavigationMap.map((item) =>
                  <SidebarItem
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    current={pathname.startsWith(item.path)}
                  >
                    {item.icon}
                    <SidebarLabel>{t(item.title)}</SidebarLabel>
                  </SidebarItem>)
              }
            </SidebarSection>

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem>
                <div className='flex justify-center gap-4 w-full flex-wrap'>
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
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            {
              userInfo && <Dropdown>
                <DropdownButton as={SidebarItem}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={userInfo.username} size="40" round="8px" />
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
                <AccountDropdownMenu anchor="top start" />
              </Dropdown>
            }
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
