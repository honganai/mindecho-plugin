import React, { useEffect, useState, useContext } from "react";
import clsx from 'clsx';
import pocketSourceIcon from '@/assets/icons/pocket_source_icon.png';
import XIcon from '@/assets/icons/image 28.png';
import GoogleIcon from '@/assets/icons/chrome-logo 1.png';
import _, { isFunction, isUndefined, set } from 'lodash'
import { Dialog } from '@/pages/Options/components/catalyst/dialog'
import { Button } from '@/pages/Options/components/catalyst/button'
import logo from '@/assets/icons/logo.png';
import { IS_NOT_FIRST_TIME_USE } from '@/constants';
import { Badge } from '@/pages/Options/components/catalyst/badge'
import { useNavigate } from "react-router-dom";
import GlobalContext from '@/reducer/global';

export interface IProcessStatus {
  count: number;
  status: number;
  type: string;
}

enum CardStatus {
  Synching,
  Imported,
  NotImported
}

const fetchProgress: () => Promise<IProcessStatus[]> = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
      resolve(res)
    })
  })
};

const { getMessage: t } = chrome.i18n;

const Page = () => {
  const [cardList, setCardList] = useState([
    {
      id: 'bookmark',
      img: <img className="h-10" src={GoogleIcon} alt="google" />,
      title: t(`browser_bookmarks_reading_list`),
      subTitle: t(`choose_from_bookmarks_reading_list_history`),
      handleClick: () => navigate('/manage-sources/browser-data'),
      status: CardStatus.NotImported
    },
    {
      id: 'history',
      img: <img className="h-10" src={GoogleIcon} alt="google" />,
      title: t(`browsing_history`),
      subTitle: t(`automatically_public_articles_news_blogs_and_essays_from_current_open_tabs`),
      handleClick: () => navigate('history-data'),
      status: CardStatus.NotImported
    },
    {
      id: "xbookmark",
      img: <img className="h-10" src={XIcon} alt="XIcon" />,
      title: t('browser_bookmarks_reading_list'),
      subTitle: t('your_bookmarks_in_X_will_be_imported_with_your_authorization_Full_text_in_the_bookmarked_content_will_be_fetched_and_made_searchable_to_you'),
      handleClick: () => navigate('twitter'),
      status: CardStatus.NotImported
    },
    {
      id: "pocket",
      img: <img className="h-10" src={pocketSourceIcon} alt="pocketSourceIcon" />,
      title: t('pocket_saves'),
      subTitle: t('your_pocket_saves_list_will_be_imported_with_secure_authorization_Full_text_of_the_saves_will_be_fetched_and_made_searchable_to_you'),
      handleClick: () => navigate('pocket'),
      status: CardStatus.NotImported
    },
  ])
  const navigate = useNavigate();
  const [isOpenFirstTimeModal, setIsOpenFirstTimeModal] = useState(false)
  const { state: globalState } = useContext(GlobalContext);
  const { userInfo } = globalState;

  useEffect(() => {
    chrome.storage.local.get(IS_NOT_FIRST_TIME_USE).then((res) => {
      if (isUndefined(res[IS_NOT_FIRST_TIME_USE])) {
        setIsOpenFirstTimeModal(true)
        chrome.storage.local.set({ [IS_NOT_FIRST_TIME_USE]: false })
      }
    })
    fetchProgress().then((res) =>
      res.forEach(({ count, status, type }) => {
        // not imported===  对应的status==0  没有>0的 
        // imported    ===   没有status为1和2的 全部为>=3
        // Synching === status存在1和2的
        const card = cardList.find(card => card.id === type)
        if (card) {
          card.status = status === 0 ? CardStatus.NotImported : status >= 3 ? CardStatus.Imported : CardStatus.Synching
          setCardList([...cardList])
        }
      }))
  }, [])

  const CardComponentMaker = ({ img, title, subTitle, handleClick, status }: {
    img: React.ReactElement | string;
    title: React.ReactElement | string;
    subTitle: React.ReactElement | string;
    handleClick: (() => void) | null,
    status: CardStatus
  }): JSX.Element => {
    return <div className="py-2 last:border-0 border-b border-gray-100">
      <div
        className=" transition-all px-3 hover hover:bg-gray-50 hover:shadow-sm rounded-md cursor-pointer"
        onClick={() => isFunction(handleClick) && handleClick()}
      >
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
            {status === CardStatus.Synching && <Badge className="!text-base !font-medium" color='lime'>{t('synching')}</Badge>}
            {status === CardStatus.Imported && <Badge className="!text-base !font-medium" color='lime'>{t('imported')}</Badge>}
            {status === CardStatus.NotImported && <Badge className="!text-base !font-medium" color='zinc'>{t('not_imported')}</Badge>}
          </div>
        </div>
      </div>
    </div>
  }

  return (
    <div className={clsx(`relative flex flex-col`)}>
      <div className="font-bold text-xl text-gray-600 mb-4 mt-2">{
        `${t('Hello')}, ${userInfo?.username}`
      }</div>

      <div className='flex flex-col'>
        {cardList.map((card, index) => (
          <CardComponentMaker
            key={index}
            img={card.img}
            title={card.title}
            subTitle={card.subTitle}
            handleClick={card.handleClick}
            status={card.status}
          />
        ))}
      </div>

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
