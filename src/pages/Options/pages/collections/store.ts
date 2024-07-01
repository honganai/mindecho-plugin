// 局部context
import { createContext } from 'react';

const state = {
  contentType: 'all',
};

export const CollectionsContext = createContext(state);
