import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
// 1. Import the type from your new file
import { InwardItem } from './types';

// 2. DELETE the old InwardItem interface from this file.

// This definition now uses the imported, shared type.
interface InwardContextType {
  items: InwardItem[];
  setItems: Dispatch<SetStateAction<InwardItem[]>>;
}

export const InwardContext = createContext<InwardContextType | undefined>(undefined);