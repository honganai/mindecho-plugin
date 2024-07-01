import React, { useContext, useRef } from 'react';
import clsx from 'clsx';
import logo from '@/assets/icons/logo.png';
import GlobalContext from '@/reducer/global';
import { useLocation } from 'react-router-dom';

const { getMessage: t } = chrome.i18n;
const headerNoticeMap = [
  {
    path: '/',
    tip: t('how_about_we_begin_by_choosing_the_treasure_trove_of_information_you_d_like_to_explore_again')
  },
  {
    path: '/browser-data',
    tip: t('select_content_to_be_made_searchable'),
  },
  {
    path: '/building',
    tip: t('enable_full_text_search_in_browsing_history_to_eliminate_the_need_for_memorization'),
  },
  {
    path: '/pocket',
    tip: t('connect_to_pocket_to_revive_your_dusty_stash'),
  },
  {
    path: '/history-data',
    tip: t('enable_full_text_search_in_browsing_history_to_eliminate_the_need_for_memorization'),
    note: t('only_URLs_of_public_articles_blogs_and_essay_PDFs_can_be_included_personal_and_work_related_history_are_NOT_included')
  },
  {
    path: '/twitter',
    tip: t('enable_search_for_your_X_bookmarks') + ' X Bookmarks',
  }]

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const { state: { userInfo } } = useContext(GlobalContext);
  const doc = headerNoticeMap.find(item => pathname.startsWith(item.path))

  return (
    <div className={clsx(`p-2 text-lg text-gray-700`)}>
      <div className="flex items-center">
        <img className={clsx(`w-10 h-10 mr-2`)} src={logo} alt="logo" />
        <span className='font-bold text-xl text-black'>mindECHO</span>
      </div>
      <p className="text-base mt-2">
        {t('universal_bookmark_search')}
      </p>
      {/* <p className={clsx(``)}>
        <p className={clsx(`text-xl	`)}>{t('Hello')}, {userInfo?.username || '-'}</p>
        {doc?.tip && <p className={clsx(`text-gray-400`)}>{doc?.tip || ''}</p>}
        {doc?.note && <p className={clsx(`fs-14 text-gray-400`)}><strong>Note:</strong> {doc.note}</p>}
      </p> */}
    </div>
  );
};

export default Header;
