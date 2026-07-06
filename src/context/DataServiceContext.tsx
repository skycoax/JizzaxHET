import { createContext, useContext } from 'react';
import type { DataService } from '@/services/types';
import { mockDataService } from '@/services/mockDataService';

export const DataServiceCtx = createContext<DataService>(mockDataService);
export const useDataService  = () => useContext(DataServiceCtx);
