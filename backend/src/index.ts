import express from 'express';
import cors from 'cors';

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

const items = Array.from({ length: 1_000_000 }, (_, i) => ({ id: i + 1 }));
type QueryKey = string; // пустая строка — «основной» список
interface QueryState {
    order: number[];          // id в порядке после сортировок
    pagesLoaded: number;      // сколько пакетов по 20 уже выдано
}
interface FullState {
    queries: Record<QueryKey, QueryState>;
    selected: Set<number>;
}

const state: FullState = {
    queries: {
        '': { order: items.map(i => i.id), pagesLoaded: 1 }
    },
    selected: new Set<number>()
};


// Пагинация, поиск
app.get('/api/items', (req, res) => {
    const skip   = Number(req.query.skip)  || 0;
    const limit  = Number(req.query.limit) || 20;
    const q      = String(req.query.q || '');

    const filteredItems = items.filter(item =>
        q ? item.id.toString().includes(q) : true
    );

    if (!state.queries[q]) {
        state.queries[q] = {
            order:        filteredItems.map(i => i.id),
            pagesLoaded:  1
        };
    }

    const queryState = state.queries[q];

    const dict = new Map<number, typeof filteredItems[0]>(
        filteredItems.map(i => [i.id, i])
    );

    const orderedItems = queryState.order
        .map(id => dict.get(id))
        .filter((i): i is typeof filteredItems[0] => !!i);

    const orderedSet = new Set(queryState.order)

    const remainingItems = filteredItems.filter(i => !orderedSet.has(i.id))

    const fullOrderedItems = [...orderedItems, ...remainingItems]
    queryState.order = fullOrderedItems.map(i => i.id)

    const result = fullOrderedItems.slice(skip, skip + limit)
    res.json({ items: result, total: filteredItems.length })
});



// Получение/сохранение состояния
app.get('/api/state', (req, res) => {
    const q = String(req.query.q || '');
    if (!state.queries[q]) {

        state.queries[q] = {
            order: items
                .filter(item => item.id.toString().includes(q))
                .map(item => item.id),
            pagesLoaded: 1
        };
    }
    const { order, pagesLoaded } = state.queries[q];
    res.json({
        order: order.slice(0, pagesLoaded * 20),
        pagesLoaded,
        selected: Array.from(state.selected)
    });
});

app.post('/api/state', (req, res) => {
    const { q = '', order, selected: sel, pagesLoaded } = req.body as {
        q?: string;
        order: number[];
        selected: number[];
        pagesLoaded: number;
    };

    state.selected = new Set(sel);

    state.queries[q] = {
        order: order.concat(

            state.queries[q]?.order.filter(id => !order.includes(id)) || []
        ),
        pagesLoaded
    };

    res.sendStatus(200);
});
app.listen(port, () => console.log(`Backend listening on ${port}`));
