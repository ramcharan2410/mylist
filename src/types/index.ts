export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Essential {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  quantityValue: string;
  quantityUnit: string;
  isChecked: boolean;
  notes: string;
  position: number;
  listId: string;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListWithItems extends List {
  items: Item[];
}

export interface ListWithCount extends List {
  itemCount: number;
  checkedCount: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  existingId?: string;
}
