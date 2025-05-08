import axios from 'axios';
import type { Item } from './types';

const api = axios.create({ baseURL: '/list/api' });

export interface FetchItemsParams {
    skip?: number;
    limit?: number;
    q?: string;
}

export const fetchItems = async (params: FetchItemsParams) => {
    const res = await api.get<{ items: Item[]; total: number }>('/items', { params });
    return res.data;
};

export const fetchState = async (q = '') => {
    const res = await api.get<{
        order: number[];
        pagesLoaded: number;
        selected: number[];
    }>('/state', { params: { q } });
    return res.data;
};

export const saveState = async (
    q: string,
    order: number[],
    selected: number[],
    pagesLoaded: number
) => {
    await api.post('/state', { q, order, selected, pagesLoaded });
};