import express from 'express';
import cors from 'cors';
import {GlobalState, Item} from "./types/types";
import {getItemsHandler, getStateHandler, postMoveHandler} from "./controllers/itemsControllers";

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

export const items: Item[] = Array.from({ length: 1_000_000 }, (_, i) => ({ id: i + 1 }));

export const state: GlobalState = {
    order: items.map(i => i.id),
    pagesLoadedPerQuery: {},
    selected: new Set<number>()
}

app.get('/api/items', getItemsHandler);

app.get('/api/state', getStateHandler);

app.post('/api/move', postMoveHandler)

app.listen(port, () => console.log(`Backend listening on ${port}`));
