
import confetti from "canvas-confetti"
import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import IllustrationImage from '@/assets/img/image14.png';

const { getMessage: t } = chrome.i18n
const Component = () => {
  const navigate = useNavigate()

  useEffect(() => {
    confetti({ particleCount: 200, spread: 150, origin: { y: 0.6 }, })
  }, [])

  return <div>
    <div
      className=" text-lg text-gray-500 cursor-pointer hover:text-gray-700 hover:underline"
      onClick={() => navigate('/manage-sources')}
    >{`< ${t('source_management')}`}</div>

    <div className="mt-4 text-4xl font-bold text-black">{t('how_to_search')}</div>
    <div className="mt-4 text-gray-500">{t('data_indexing_may_still_take_a_while')}</div>
    <div className="mt-2 text-gray-500">
      {`${t('you_can_call_up_the_mindecho_search_box_any_time')} `}
      <span className="font-bold text-gray-700">{t('on_any_tab_other_than_the_new_tab_tab')}</span>
    </div>

    <div className="mt-8 pb-4 border-b border-gray-200 text-4xl font-bold text-black" >{t('try_now')}</div>

    <div className="mt-10 grid grid-cols-2 leading-10 text-lg">
      <div className="flex gap-4">
        <div className="text-lg w-8 h-8 flex items-center justify-center text-white bg-black rounded-full mt-1">1</div>
        <div className="w-0 flex-1">
          <div className="">{t('use_keyboard_shortcut')}</div>

          <div className="">
            {t('press')}
            <span className="text-violet-500">Command + E</span>
            {t('on_mac')}
          </div>
          <div className="">
            {t('press')}
            <span className="text-violet-500">Ctrl + E</span>
            {t('on_pc')}
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <div className=" mt-1 text-lg w-8 h-8 flex items-center justify-center text-white bg-black rounded-full">2</div>
        <div className="w-0 flex-1">
          <div className="">{t('pin_browser_extension_icon_above')}</div>
          <img width={358} height={265} src={IllustrationImage} alt="" />
        </div>
      </div>
    </div>
  </div>
}

export default Component