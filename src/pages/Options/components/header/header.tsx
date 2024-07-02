import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const { getMessage: t } = chrome.i18n;

const Header: React.FC = () => {
  const headerNoticeMap = [
    {
      path: '/',
      tip: t('how_about_we_begin_by_choosing_the_treasure_trove_of_information_you_d_like_to_explore_again')
    },
    {
      path: '/manage-sources/browser-data',
      title: t('bookMarks_reading_lists'),
      tip: t('automatically_public_articles_news_blogs_and_essays_from_current_open_tabs'),
    },
    {
      path: '/building',
      tip: t('enable_full_text_search_in_browsing_history_to_eliminate_the_need_for_memorization'),
    },
    {
      path: '/manage-sources/pocket',
      tip: t('connect_to_pocket_to_revive_your_dusty_stash'),
    },
    {
      path: '/manage-sources/history-data',
      title: t('public_content_from_browser_history'),
      tip: t('enable_full_text_search_in_browsing_history_to_eliminate_the_need_for_memorization'),
      note: t('only_URLs_of_public_articles_blogs_and_essay_PDFs_can_be_included_personal_and_work_related_history_are_NOT_included')
    },
    {
      path: '/manage-sources/twitter',
      title: `X ${t('bookmarks')}`,
      tip: t('enable_search_for_your_X_bookmarks') + ' X Bookmarks',
    }
  ]

  const { pathname } = useLocation();
  const [doc, setDoc] = useState(headerNoticeMap.find(item => pathname.startsWith(item.path)))

  useEffect(() => setDoc(headerNoticeMap.find(item => pathname === item.path)), [pathname])

  return (
    <div className='mb-2'>
      {doc?.title && <div className="font-bold text-lg text-black">{doc.title}</div>}
      {doc?.tip && <div className="mt-2">{doc.tip}</div>}
      {doc?.note && <div className="text-gray-700">
        <span className="font-bold text-gray-950">{t('Note')}</span>
        {doc.note}
      </div>
      }
    </div>
  );
};

export default Header;
