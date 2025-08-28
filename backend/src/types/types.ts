export interface Item {
    id: number;
}

export interface GlobalState {
    order: number[]
    pagesLoadedPerQuery: Record<string, number>
    selected: Set<number>
}

export interface MoveParams {
    q?: string;
    movedId?: number | null;
    beforeId?: number | null;
    pagesLoaded: number;
    selected: number[];
}

export interface ItemsResponse {
    items: Item[];
    total: number;
}

export interface StateResponse {
    order: number[];
    pagesLoaded: number;
    selected: number[];
}