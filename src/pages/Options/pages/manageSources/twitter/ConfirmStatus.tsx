import clsx from "clsx"
import React from "react"
import { Button } from '@/pages/Options/components/catalyst/button'
import XGuidePNG from '@/assets/icons/CleanShot 2024-05-17 at 13.45 1.png';
import { useNavigate } from 'react-router-dom';

const goTwitter = () => {
  chrome.runtime.sendMessage({ type: 'twitter' }, (res) => {
    console.log('twitter res:', res);
  });
};
const { getMessage: t } = chrome.i18n;

const Component = ({ isLoginTwitter, nextStep }: {
  isLoginTwitter: boolean, nextStep: () => void
}) => {
  const navigate = useNavigate();

  return <div>
    <div className={clsx(
      `grid grid-cols-1 gap-x-6 gap-y-10 pt-10 lg:grid-cols-3`
    )}>

      <div className="text-2xl font-semibold leading-9 tracking-tight text-slate-900">
        {t('open_x_bookmarks_page')}
      </div>

      <div className=" text-lg leading-8 col-span-2">
        <p className='text-bold'>{t('please_first_log_into_x_com_and_open_your_bookmarks_page')} </p>
        <p className={clsx(
          'cursor-pointer text-violet-500 '
        )} onClick={goTwitter}>https://x.com/i/bookmarks/all</p>
        <img className='mt-8' src={XGuidePNG} alt="" />
      </div>
    </div>

    <div className={clsx(
      `gap-x-6 gap-y-10 pt-10`,
      `flex items-center justify-between`
    )}>
      <div className="text-2xl font-semibold leading-9 tracking-tight text-slate-900">
        <div>{t('switch_back_to_this_page_and_continue')}</div>
      </div>

      <div className="leading-8">
        <Button className="mr-4" outline onClick={() => navigate('/manage-sources')}>
          {t('cancel')}
        </Button>

        {isLoginTwitter ? (
          <Button onClick={nextStep}>
            {t('continue')} {`>`}
          </Button>
        ) : (
          <Button onClick={goTwitter}>
            {t('to_login_x')}
          </Button>
        )}
      </div>
    </div>

  </div>
}

export default Component