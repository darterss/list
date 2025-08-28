export interface Item {
    id: number;
    content: string;
}

export interface FetchItemsParams {
    skip?: number
    limit?: number
    q?: string
}

export interface MoveParams {
    q?: string;
    movedId?: number | null;
    beforeId?: number | null;
    pagesLoaded: number;
    selected: number[];
}

export interface SearchParams {
    value: string
    onChange: (v: string) => void
}

export type ItemRowParams = {
    item: Item
    selected: boolean
    onSelect: (id: number, checked: boolean) => void
}