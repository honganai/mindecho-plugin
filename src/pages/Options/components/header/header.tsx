import React, { useContext, useRef } from 'react';
import clsx from 'clsx';
import logo from '@/assets/icons/logo.png';
import GlobalContext from '@/reducer/global';

interface Props {
  tip?: string;
  note?: string;
}

const Header: React.FC<Props> = ({ tip, note }) => {
  const { getMessage: t } = chrome.i18n;
  const { state: { userInfo } } = useContext(GlobalContext);
  const el_userInfo = useRef(null);

  return (
    <div className={clsx(`flex p-2  text-lg	 items-center text-gray-700 weight-500`)} ref={el_userInfo}>
      <img className={clsx(`w-25 h-24  mr-2`)} src={logo} alt="logo" />
      <div className={clsx(`weight-500 flex flex-col justify-center`)}>
        <p className={clsx(`text-xl	`)}>{t('Hello')}, {userInfo?.username || '-'}</p>
        <p className={clsx(`text-gray-400`)}>{tip || ''}</p>
        {
          note && <p className={clsx(`fs-14 text-gray-400`)}><strong>{t('Note')}:</strong> {note}</p>
        }
      </div>
    </div>
  );
};

export default Header;
