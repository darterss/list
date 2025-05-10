"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = 3003;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const items = Array.from({ length: 1000000 }, (_, i) => ({ id: i + 1 }));
const state = {
    order: items.map(i => i.id),
    pagesLoadedPerQuery: {},
    selected: new Set()
};
// 🔍 Пагинация и поиск (с глобальным порядком)
app.get('/api/items', (req, res) => {
    const t0 = performance.now();
    const skip = Number(req.query.skip) || 0;
    const limit = Number(req.query.limit) || 20;
    const q = String(req.query.q || '');
    const filteredItems = items.filter(item => q ? item.id.toString().includes(q) : true);
    console.log(`🔍 Поиск "${q}" нашёл ${filteredItems.length} элементов`);
    const dict = new Map(filteredItems.map(i => [i.id, i]));
    const orderedItems = state.order
        .map(id => dict.get(id))
        .filter((i) => !!i);
    // те, кто не попали в order
    const orderedSet = new Set(state.order);
    const remainingItems = filteredItems.filter(i => !orderedSet.has(i.id));
    const fullOrderedItems = [...orderedItems, ...remainingItems];
    const result = fullOrderedItems.slice(skip, skip + limit);
    const t1 = performance.now();
    console.log(`⚙️ Обработка запроса заняла ${Math.round(t1 - t0)}ms`);
    res.json({ items: result, total: filteredItems.length });
});
// 📦 Получение состояния (срез глобального порядка)
app.get('/api/state', (req, res) => {
    const q = String(req.query.q || '');
    const filtered = items
        .filter(item => item.id.toString().includes(q))
        .map(i => i.id);
    const set = new Set(filtered);
    const filteredOrdered = state.order.filter(id => set.has(id));
    const sliced = filteredOrdered.slice(0, state.pagesLoadedPerQuery[q] * 20);
    console.log(`📥 Состояние для "${q}": ${sliced.length} элементов`);
    res.json({
        order: sliced,
        pagesLoaded: state.pagesLoadedPerQuery[q],
        selected: Array.from(state.selected)
    });
});
// 💾 Сохранение состояния — обновление только реально перемещённых ID
app.post('/api/move', (req, res) => {
    const { q = '', movedId, beforeId, pagesLoaded, selected: sel } = req.body;
    // сохраняем выбранные
    state.selected = new Set(sel);
    // сохраняем pagesLoaded
    state.pagesLoadedPerQuery[q] = pagesLoaded;
    // если есть movedId & beforeId — переставляем, иначе их игнорируем
    if (movedId != null && beforeId != null) {
        state.order = state.order.filter(id => id !== movedId);
        const idx = state.order.indexOf(beforeId);
        if (idx >= 0)
            state.order.splice(idx, 0, movedId);
        else
            state.order.push(movedId);
        console.log(`🔁 Вставили ${movedId} перед ${beforeId}`);
    }
    res.sendStatus(200);
});
app.listen(port, () => console.log(`🚀 Backend listening on ${port}`));
