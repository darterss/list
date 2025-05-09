import express from 'express';
import cors from 'cors';

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

const items = Array.from({ length: 1000000 }, (_, i) => ({ id: i + 1 }));
type QueryKey = string;

interface FullState {
    order: number[];
    selected: Set<number>;
    queries: Record<QueryKey, { pagesLoaded: number }>;
}


const state: FullState = {
    order: items.map(i => i.id),
    queries: {},
    selected: new Set<number>()
};


// Пагинация, поиск
app.get('/api/items', (req, res) => {
    const skip   = Number(req.query.skip)  || 0;
    const limit  = Number(req.query.limit) || 20;
    const q      = String(req.query.q || '');

    const filtered = items.filter(item =>
        q ? item.id.toString().includes(q) : true
    );

    const dict = new Map<number, typeof items[0]>(
        filtered.map(i => [i.id, i])
    );

    const ordered = state.order
        .map(id => dict.get(id))
        .filter((i): i is typeof items[0] => !!i);

    // Добавляем элементы, которых нет в order
    const orderedSet = new Set(ordered.map(i => i.id));
    const remaining = filtered.filter(i => !orderedSet.has(i.id));

    const result = [...ordered, ...remaining];

    // pagesLoaded по query
    if (!state.queries[q]) {
        state.queries[q] = { pagesLoaded: 1 };
    }

    res.json({
        items: result.slice(skip, skip + limit),
        total: result.length
    });
});




// Получение/сохранение состояния
app.get('/api/state', (req, res) => {
    const q = String(req.query.q || '');
    if (!state.queries[q]) {
        state.queries[q] = { pagesLoaded: 1 };
    }

    const filtered = items
        .filter(item => q ? item.id.toString().includes(q) : true)
        .map(item => item.id);

    const ordered = state.order.filter(id => filtered.includes(id));

    res.json({
        order: ordered.slice(0, state.queries[q].pagesLoaded * 20),
        pagesLoaded: state.queries[q].pagesLoaded,
        selected: Array.from(state.selected)
    });
});


app.post('/api/state', (req, res) => {
    const { q = '', order, selected: sel, pagesLoaded } = req.body;

    state.selected = new Set(sel);

    const oldOrder = state.order;
    const newOrder = order.concat(oldOrder.filter(id => !order.includes(id)));
    state.order = newOrder;

    if (!state.queries[q]) state.queries[q] = { pagesLoaded };
    else state.queries[q].pagesLoaded = pagesLoaded;

    res.sendStatus(200);
});

app.listen(port, () => console.log(`Backend listening on ${port}`));
