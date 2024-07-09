import React, { useState, useContext } from "react"
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import clsx from "clsx"
import usePolling from "@/utils/usePolling";
import { UserInfo } from "@/types";

const { getMessage: t } = chrome.i18n;

export enum UserLevel {
  Free = 'free',
  Pro = 'pro'
}

enum PayPlan {
  Monthly = 0,
  Annually = 1
}
// const host = process.env.API_URL
// const STRIPE_MONTHLY_PRODUCT_ID = process.env.STRIPE_MONTHLY_PRODUCT_ID
// const STRIPE_ANNUALLY_PRODUCT_ID = process.env.STRIPE_ANNUALLY_PRODUCT_ID
export interface IUserInfoResult {
  result: Result;
}

export enum PayReason {
  OverAsk,
  OverUrl
}

export interface Result {
  active: boolean;
  changed_by_fk: null;
  changed_on: Date;
  created_by_fk: null;
  created_on: Date;
  distinct_id: string;
  email: string;
  fail_login_count: number;
  first_name: string;
  id: number;
  lang_type: string;
  last_login: Date;
  last_name: string;
  login_count: number;
  subscription: Subscription;
  username: string;
}

export interface Subscription {
  gpt4_quota: number;
  gpt4_used_count: number;
  mem_ship_date: string;
  mem_type: string;
  quota_reset_time: Date;
  quota_start_time: Date;
  quota_used_count: number;
  total_monthly_quota: string;
}

const host = `https://me.hongan.live`
const STRIPE_MONTHLY_PRODUCT_ID = `2`
const STRIPE_ANNUALLY_PRODUCT_ID = `3`

const PayPlanMap = [
  {
    id: PayPlan.Monthly,
    text: t('billed_monthly'),
    price: 10,
    trial: 1,
    trialDays: 7,
    productID: STRIPE_MONTHLY_PRODUCT_ID,
  },
  {
    id: PayPlan.Annually,
    text: t('billed_annually'),
    price: 6,
    trial: 1,
    trialDays: 14,
    productID: STRIPE_ANNUALLY_PRODUCT_ID
  }
]

const PayReasonMap = [
  {
    id: PayReason.OverUrl,
    line1: t('you_ve_reached_2000_indexed_items'),
    line2: t('upgrade_to_pro_plan_for_unlimited_collections_and_ai_answers_enjoy_a_1_trial_f'),

  },
  {
    id: PayReason.OverAsk,
    line1: t('unlock_unlimited_ai_answers_from_your_collections'),
    line2: t('with_the_mindecho_pro_plan_ai_searches_all_your_collections_to_deliver_the_most')
  }
]

const fetchingPaymentStatus:
  () => Promise<IUserInfoResult | undefined>
  = async () =>
    new Promise(resolve => {
      chrome.runtime.sendMessage(
        { type: 'request', api: 'userinfo' },
        (result: IUserInfoResult) => resolve(result)
      );
    })


const PaymentForm = ({ payReason = PayReason.OverAsk }: {
  payReason?: PayReason
}) => {
  const [payPlan, setPayPlan] = useState<PayPlan>(PayPlan.Monthly);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = PayPlanMap.find(
    item => item.id === payPlan
  );
  const currentReason = PayReasonMap.find(
    item => item.id === payReason
  );

  const { startPolling, stopPolling } = usePolling(async () => {
    fetchingPaymentStatus().then((result) => {
      if (result?.result.subscription.mem_type !== UserLevel.Free) {
        stopPolling()
        setIsLoading(false)
      }
      result?.result && globalDispatch({
        type: GlobalActionType.SetUserInfo,
        payload: result?.result as unknown as UserInfo,
      })
    })
  }, 2000)

  return <>
    <div className="overflow-hidden border-slate-500 rounded-lg bg-white border grid grid-cols-5">
      <div className="col-span-3 p-5">
        <h2 className="mb-2 text-slate-500 font-medium text-xl">{currentReason?.line1}</h2>
        <div className="text-gray-500 font-light text-base">{currentReason?.line2}</div>

        <div className="mt-6 grid gap-1 gap-y-2 grid-cols-2">
          {[
            'Unlimited AI Answers',
            'Fuzzy Search',
            'Unlimited Searchable Items',
            'Multi-Lang Search',
            'Unlimited Searches',
            'Full Text Search'
          ].map((item, index) => {
            return <div key={index} className="flex">
              <svg className="text-green-400 shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span className={clsx(
                `text-gray-500 ml-1 leading-5 text-sm`,
                index % 2 === 0 ? 'font-semibold' : 'font-normal'
              )}>{item}</span>
            </div>
          })}
        </div>
      </div>
      <div className="col-span-2 bg-gray-50 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center text-sm">
            <div className=" text-5xl font-extrabold text-slate-800 mr-2">$1</div>

            <div className='text-sm flex-1 text-gray-500 flex flex-col justify-between'>
              <div className="text-slate-900">
                {`${t('for_a')} ${currentPlan?.trialDays}${t('day_trial_of_pro_plan')}`}
              </div>
              <div className="">
                {`${t('then')} $${currentPlan?.price} ${t('per_month_billed_annually')}`}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 text-gray-500">
            {
              PayPlanMap.map((item, index) => {
                return <div key={index} className="col-span-1 flex items-center cursor-pointer" onClick={() => {
                  setPayPlan(item.id)
                }}>
                  <span className={
                    clsx(
                      payPlan === item.id ? `bg-[#6563FF]` : `bg-gray-300`,
                      " w-2 h-2  rounded-full mr-2"
                    )
                  } />
                  <span>{item.text}</span>
                </div>
              })
            }
          </div>
        </div>

        <div className=''>
          <div className="cursor-pointer text-lg bg-[#6563FF] text-white font-medium py-2 px-5 rounded-lg flex items-center justify-center bg-primary-600" onClick={
            () => {
              if (currentPlan?.productID) {
                window.open(`${host}/api/v1/order/create?product_id=${currentPlan.productID}&redirect=true`)
                setIsLoading(true)
                startPolling()
              }
            }
          }>{t('start_trial')}</div>
          <div className="mt-1 text-center text-gray-500">{t('cancel_anytime')}</div>
        </div>
      </div>
    </div>

    {isLoading &&
      <div className={
        clsx(
          'fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80',
          'dark:bg-gray-800 dark:bg-opacity-80'
        )
      }>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    }
  </>
}

export default PaymentForm