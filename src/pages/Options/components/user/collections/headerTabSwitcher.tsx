// 顶部的类型切换器

import React from "react";
import clsx from "clsx";
import _ from "lodash";
import GlobalContext, { ContentTypeMap, ActionType as GlobalActionType } from "@/reducer/global";

interface Props {
  currentContentType: number;
  onTypeChange: (type: number) => void;
}

export const CollectionsHeaderTabSwitcher: React.FC<Props> = ({
  currentContentType,
  onTypeChange
}: any) => {
  const { state: { progress }, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [contentTypeList, setContentTypeList] = React.useState(Object.keys(ContentTypeMap).map((Key, i) => ({
    code: Key,
    key: i + 1,
    title: ContentTypeMap[Key],
    count: 0
  })));

  React.useEffect(() => {
    setContentTypeList([
      {
        code: 'all',
        key: 0,
        title: 'All Items',
        count: 0
      },
      ...contentTypeList
    ])
  }, [])

  React.useEffect(() => {
    if (progress?.length) {
      const validData = progress.filter(item => item.status > 0)
      const nextData = _.cloneDeep(contentTypeList)
      console.log(validData);

      let allCount = 0

      validData.forEach(item => {
        const targetTypeIndex = nextData.findIndex(ite => ite.code === item?.type)
        console.log(targetTypeIndex, item?.type);

        if (targetTypeIndex > -1) {
          allCount += item.count
          nextData[targetTypeIndex].count = item.count
        }
      })
      nextData[0].count = allCount
      console.log(nextData);

      setContentTypeList(nextData)
    }
  }, [progress]);

  return <div className="mb-4 w-full flex no-wrap overflow-auto">
    {contentTypeList.map((item) => {
      return <div
        className={clsx(
          `mr-1 basic-40 leading-8 cursor-pointer inline-flex gap-0.5 justify-center overflow-hidden transition rounded-full bg-zinc-100 py-1 px-3 text-zinc-700 hover:bg-zinc-200`,
          item.key === currentContentType ? 'font-bold text-zinc-900' : 'font-xl',
        )}
        key={item.key}
        onClick={() => onTypeChange(item.key)}
      >{`${item.title} (${item.count})`}</div>
    })}

  </div>
}