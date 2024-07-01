import React, { useEffect, useState } from "react";
import clsx from 'clsx';
import pocketSourceIcon from '@/assets/icons/pocket_source_icon.png';
import XIcon from '@/assets/icons/image 28.png';
import GoogleIcon from '@/assets/icons/chrome-logo 1.png';
import _, { isFunction, isUndefined } from 'lodash'
import { Dialog } from '@/pages/Options/components/catalyst/dialog'
import { Button } from '@/pages/Options/components/catalyst/button'
import logo from '@/assets/icons/logo.png';
import { IS_NOT_FIRST_TIME_USE } from '@/constants';
import { Badge } from '@/pages/Options/components/catalyst/badge'
import { useNavigate } from "react-router-dom";

const Page = () => {
  const navigate = useNavigate();
  const { getMessage: t } = chrome.i18n;
  const [isOpenFirstTimeModal, setIsOpenFirstTimeModal] = useState(true)

  useEffect(() => {
    chrome.storage.local.get(IS_NOT_FIRST_TIME_USE).then((res) => {
      if (isUndefined(res[IS_NOT_FIRST_TIME_USE])) {
        setIsOpenFirstTimeModal(true)
        chrome.storage.local.set({ [IS_NOT_FIRST_TIME_USE]: false })
      }
    })
  }, [])

  const CardComponentMaker = ({ img, title, subTitle, handleClick, isSynching }: {
    img: React.ReactElement | string;
    title: React.ReactElement | string;
    subTitle: React.ReactElement | string;
    handleClick: (() => void) | null,
    isSynching: boolean
  }): JSX.Element => {
    return <li className="mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-6 py-3 w-0 flex-1">
          <div className="flex items-center justify-center w-32 h-32 shrink-0 size-10/12 rounded-lg shadow">
            {img}
          </div>
          <div className="space-y-1.5">
            <div className="text-base/6 font-semibold">
              {title}
            </div>
            <div className="text-xs/6 text-zinc-500">
              {subTitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge onClick={() => isFunction(handleClick) && handleClick()} className="!text-base !font-medium" color={isSynching ? 'lime' : 'zinc'}>
            {isSynching ? t('synching') : t('not_imported')}
          </Badge>
        </div>
      </div>
    </li>
  }

  return (
    <div className={clsx(`relative flex flex-col px-4 pl-4`)}>
      <ul>
        {[
          {
            img: <img className="h-10" src={GoogleIcon} alt="google" />,
            title: t(`browser_bookmarks_reading_list`),
            subTitle: t(`choose_from_bookmarks_reading_list_history`),
            handleClick: () => navigate('/manage-sources/browser-data'),
            isSynching: false
          },
          {
            img: <img className="h-10" src={GoogleIcon} alt="google" />,
            title: t(`browsing_history`),
            subTitle: t(`automatically_public_articles_news_blogs_and_essays_from_current_open_tabs`),
            handleClick: () => navigate('history-data'),
            isSynching: false
          },
          {
            img: <img className="h-10" src={XIcon} alt="XIcon" />,
            title: t('browser_bookmarks_reading_list'),
            subTitle: t('your_bookmarks_in_X_will_be_imported_with_your_authorization_Full_text_in_the_bookmarked_content_will_be_fetched_and_made_searchable_to_you'),
            handleClick: () => navigate('twitter'),
            isSynching: true
          },
          {
            img: <img className="h-10" src={pocketSourceIcon} alt="pocketSourceIcon" />,
            title: t('pocket_saves'),
            subTitle: t('your_pocket_saves_list_will_be_imported_with_secure_authorization_Full_text_of_the_saves_will_be_fetched_and_made_searchable_to_you'),
            handleClick: () => navigate('pocket'),
            isSynching: true
          },
          // {
          //   img: <img className="h-10" src={raindropIcon} alt="raindropIcon" />,
          //   title: t('browser_bookmarks_reading_list'),
          //   subTitle: t('more_sources_will_be_supported'),
          //   handleClick: null,
          //   isSynching: true
          // },
          // {
          //   img: <img className="h-10" src={RIcon} alt="RIcon" />,
          //   title: t('more_sources_will_be_supported'),
          //   subTitle: t('more_sources_will_be_supported'),
          //   handleClick: null,
          //   isSynching: true
          // }
        ].map((card, index) => (
          <CardComponentMaker
            key={index}
            img={card.img}
            title={card.title}
            subTitle={card.subTitle}
            handleClick={card.handleClick}
            isSynching={card.isSynching}
          />
        ))}
      </ul>

      <Dialog size='xl' open={isOpenFirstTimeModal} onClose={setIsOpenFirstTimeModal}>
        <div className="flex items-center justify-center flex-col">
          <img className={clsx(`w-25 h-24  mr-2`)} src={logo} alt="logo" />
          <p className="font-bold text-xl">{t('import_at_least_one_bookmark_source_to_search_in')}</p>
          <Button className="cursor-pointer mt-10 min-w-48 min-h-12" onClick={() => setIsOpenFirstTimeModal(false)}>
            {t('go')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default Page
