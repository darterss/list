import axios from 'axios'
import type { FetchItemsParams, Item, MoveParams } from './types'

const PREFIX = import.meta.env.BASE_URL
const api = axios.create({
    baseURL: `${PREFIX}api`,
})

export const fetchItems = async (params: FetchItemsParams) => {
    const res = await api.get<{ items: Item[]; total: number }>('/items', { params })
    return res.data
}

export const fetchState = async (q = '') => {
    const res = await api.get<{
        order: number[]
        pagesLoaded: number
        selected: number[]
    }>('/state', { params: { q } })
    return res.data
}

/*export const saveState = async (
    q: string,
    order: number[] | null,
    selected: number[],
    pagesLoaded: number
) => {
    await api.post('/state', { q, ...(order ? { order } : {}), selected, pagesLoaded })
}*/

export const saveMove = async ({
                                   q,
                                   movedId = null,
                                   beforeId = null,
                                   pagesLoaded,
                                   selected,
                               }: MoveParams) => {
    await api.post('/move', {q, movedId, beforeId, pagesLoaded, selected});
};