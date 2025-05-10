import express from 'express';
import cors from 'cors';

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

const items = Array.from({ length: 1_000_000 }, (_, i) => ({ id: i + 1 }));

interface GlobalState {
    order: number[]
    pagesLoadedPerQuery: Record<string, number>
    selected: Set<number>
}
const state: GlobalState = {
    order: items.map(i => i.id),
    pagesLoadedPerQuery: {},
    selected: new Set<number>()
}
interface MoveParams {
    q?: string;
    movedId?: number | null;
    beforeId?: number | null;
    pagesLoaded: number;
    selected: number[];
}

app.get('/api/items', (req, res) => {
    const t0 = performance.now();

    const skip  = Number(req.query.skip) || 0;
    const limit = Number(req.query.limit) || 20;
    const q     = String(req.query.q || '');

    const filteredItems = items.filter(item =>
        q ? item.id.toString().includes(q) : true
    );

    const dict = new Map<number, typeof items[0]>(
        filteredItems.map(i => [i.id, i])
    );

    const orderedItems = state.order
        .map(id => dict.get(id))
        .filter((i): i is typeof items[0] => !!i);

    // те, кто не попали в order
    const orderedSet = new Set(state.order);
    const remainingItems = filteredItems.filter(i => !orderedSet.has(i.id));

    const fullOrderedItems = [...orderedItems, ...remainingItems];
    const result = fullOrderedItems.slice(skip, skip + limit);

    const t1 = performance.now();
    console.log(`Обработка запроса заняла ${Math.round(t1 - t0)}ms`);

    res.json({ items: result, total: filteredItems.length });
});

app.get('/api/state', (req, res) => {
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
});

app.post('/api/move', (req, res) => {
    const { q = '', movedId, beforeId, pagesLoaded, selected: sel } = req.body as MoveParams

    // сохраняем выбранные
    state.selected = new Set(sel)
    // сохраняем pagesLoaded
    state.pagesLoadedPerQuery[q] = pagesLoaded

    // если есть movedId & beforeId — переставляем, иначе их игнорируем
    if (movedId != null && beforeId != null) {
        state.order = state.order.filter(id => id !== movedId)
        const idx = state.order.indexOf(beforeId)
        if (idx >= 0) state.order.splice(idx, 0, movedId)
        else state.order.push(movedId)
    }

    res.sendStatus(200)
})

app.listen(port, () => console.log(`Backend listening on ${port}`));
