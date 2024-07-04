import React, { useContext } from 'react'
import {
  Dropdown,
  DropdownButton,
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
import logo from '@/assets/icons/logo.png';
import GlobalContext, { ActionType, NavigationMap } from '@/reducer/global'
import Avatar from 'react-avatar';
import clsx from 'clsx';

const { getMessage: t } = chrome.i18n;

export function ApplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { state: globalState } = useContext(GlobalContext);
  const { userInfo } = globalState;
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <SidebarLayout
      navbar={<></>}
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div className={clsx(`p-2 text-lg text-gray-700`)}>
              <div className="flex items-center">
                <img className={clsx(`w-10 h-10 mr-2`)} src={logo} alt="logo" />
                <span className='font-bold text-xl text-black'>mindECHO</span>
              </div>
              <p className="text-base mt-2">
                {t('universal_bookmark_search')}
              </p>
            </div>
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
              <SidebarItem href="mailto:Echo@linnk.ai">
                <span className="mr-1 [&>svg]:h-5 [&>svg]:w-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 512 512"
                  >
                    <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"></path>
                  </svg>
                </span>
                <SidebarLabel>{t('questions')}</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="mailto:Echo@linnk.ai">
                <span className="[&>svg]:h-6 [&>svg]:w-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 640 512"
                  >
                    <path
                      d="M524.5 69.8a1.5 1.5 0 0 0 -.8-.7A485.1 485.1 0 0 0 404.1 32a1.8 1.8 0 0 0 -1.9 .9 337.5 337.5 0 0 0 -14.9 30.6 447.8 447.8 0 0 0 -134.4 0 309.5 309.5 0 0 0 -15.1-30.6 1.9 1.9 0 0 0 -1.9-.9A483.7 483.7 0 0 0 116.1 69.1a1.7 1.7 0 0 0 -.8 .7C39.1 183.7 18.2 294.7 28.4 404.4a2 2 0 0 0 .8 1.4A487.7 487.7 0 0 0 176 479.9a1.9 1.9 0 0 0 2.1-.7A348.2 348.2 0 0 0 208.1 430.4a1.9 1.9 0 0 0 -1-2.6 321.2 321.2 0 0 1 -45.9-21.9 1.9 1.9 0 0 1 -.2-3.1c3.1-2.3 6.2-4.7 9.1-7.1a1.8 1.8 0 0 1 1.9-.3c96.2 43.9 200.4 43.9 295.5 0a1.8 1.8 0 0 1 1.9 .2c2.9 2.4 6 4.9 9.1 7.2a1.9 1.9 0 0 1 -.2 3.1 301.4 301.4 0 0 1 -45.9 21.8 1.9 1.9 0 0 0 -1 2.6 391.1 391.1 0 0 0 30 48.8 1.9 1.9 0 0 0 2.1 .7A486 486 0 0 0 610.7 405.7a1.9 1.9 0 0 0 .8-1.4C623.7 277.6 590.9 167.5 524.5 69.8zM222.5 337.6c-29 0-52.8-26.6-52.8-59.2S193.1 219.1 222.5 219.1c29.7 0 53.3 26.8 52.8 59.2C275.3 311 251.9 337.6 222.5 337.6zm195.4 0c-29 0-52.8-26.6-52.8-59.2S388.4 219.1 417.9 219.1c29.7 0 53.3 26.8 52.8 59.2C470.7 311 447.5 337.6 417.9 337.6z" />
                  </svg>
                </span>
                <SidebarLabel>Discord</SidebarLabel>
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

                <DropdownMenu className="min-w-64" anchor='top start'>
                  <DropdownItem
                    onClick={() => {
                      chrome.runtime.sendMessage({
                        type: 'request',
                        api: 'sign_out',
                      }, () => {
                        chrome.runtime.sendMessage(
                          { type: 'request', api: 'user_url_status' },
                          () => {
                            setTimeout(() => window.location.reload(), 1000)
                          })
                      })
                    }}
                  >
                    <ArrowRightStartOnRectangleIcon />
                    <DropdownLabel>{t('sign_out')}</DropdownLabel>
                  </DropdownItem>
                </DropdownMenu>
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
