import clsx from "clsx"
import React from "react"
import { Button } from 'antd';
import XGuidePNG from '@/assets/icons/CleanShot 2024-05-17 at 13.45 1.png';

const goTwitter = () => {
  chrome.runtime.sendMessage({ type: 'twitter' }, (res) => {
    console.log('twitter res:', res);
  });
};
const { getMessage: t } = chrome.i18n;

const Component = ({ isLoginTwitter, nextStep }: {
  isLoginTwitter: boolean, nextStep: () => void
}) => {
  return <div>
    <div className={clsx(
      'mt-4',
    )}>X Bookmarks</div>

    <p className={clsx(
      'flex flex-col items-center justify-center',
      'text-xl text-slate-700'
    )}>
      <p className='w-full'>
        <span className='pl-10'>{t('please_first_log_into_your_x_account_and')}</span>
        <span className='text-bold'>{t('open_your_bookmarks_page')} </span>
        <p className={clsx(
          'text-center'
        )} onClick={goTwitter}>https://x.com/i/bookmarks/all</p>
      </p>

      <img className='mt-8' src={XGuidePNG} alt="" />

      <p className='w-full pl-10 my-4'>{t('switch_back_to_this_page_and_continue')}</p>
    </p>

    {isLoginTwitter ? (
      <Button className={clsx(
        'min-w-96',
      )} onClick={nextStep}>
        {t('continue')} {`>`}
      </Button>
    ) : (
      <Button className={clsx(
        'min-w-96',
      )} onClick={goTwitter}>
        {t('to_login_x')}
      </Button>
    )}
  </div>
}

export default Component