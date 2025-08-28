import {Request, Response} from "express";
import {Item, ItemsResponse, MoveParams, StateResponse} from "../types/types";
import {items, state} from "../index";

export const getItemsHandler = (req: Request, res: Response<ItemsResponse>) => {
    const t0 = performance.now();

    const skip  = Number(req.query.skip) || 0;
    const limit = Number(req.query.limit) || 20;
    const q     = String(req.query.q || '');

    const filteredItems: Item[] = items.filter(item =>
        q ? item.id.toString().includes(q) : true
    );

    const dict = new Map<number, Item>(
        filteredItems.map(i => [i.id, i])
    );

    const orderedItems: Item[] = state.order
        .map(id => dict.get(id))
        .filter((i): i is typeof items[0] => !!i);

    // те, кто не попали в order
    const orderedSet = new Set(state.order);
    const remainingItems: Item[] = filteredItems.filter(i => !orderedSet.has(i.id));

    const fullOrderedItems: Item[] = [...orderedItems, ...remainingItems];
    const result: Item[] = fullOrderedItems.slice(skip, skip + limit);

    const t1 = performance.now();
    console.log(`Обработка запроса заняла ${Math.round(t1 - t0)}ms`);

    res.json({ items: result, total: filteredItems.length });
}

export const getStateHandler = (req: Request, res: Response<StateResponse>) => {
    const q = String(req.query.q || '');
    const filtered = items
        .filter(item => item.id.toString().includes(q))
        .map(i => i.id);
    const set = new Set(filtered);

    const filteredOrdered = state.order.filter(id => set.has(id));
    const sliced = filteredOrdered.slice(0, state.pagesLoadedPerQuery[q] * 20);

    res.json({
        order: sliced,
        pagesLoaded: state.pagesLoadedPerQuery[q],
        selected: Array.from(state.selected)
    });
}

export const postMoveHandler = (req: Request, res: Response) => {
    const { q = '', movedId, beforeId, pagesLoaded, selected: sel } = req.body as MoveParams

    // сохраняем выбранные
    state.selected = new Set(sel)
    // сохраняем pagesLoaded
    state.pagesLoadedPerQuery[q] = pagesLoaded

    // если есть movedId & beforeId — переставляем, иначе игнорируем
    if (movedId != null && beforeId != null) {
        state.order = state.order.filter(id => id !== movedId)
        const idx = state.order.indexOf(beforeId)
        if (idx >= 0) state.order.splice(idx, 0, movedId)
        else state.order.push(movedId)
    }

    res.sendStatus(200)
}