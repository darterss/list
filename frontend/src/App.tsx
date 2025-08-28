import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fetchItems, fetchState, saveMove } from './api';
import type { Item } from './types';
import { SearchBar } from './components/SearchBar';
import { ItemRow } from './components/ItemRow';

export const App: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [total, setTotal] = useState(1000000);
    const [hasMore, setHasMore] = useState(true);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [pagesLoaded, setPagesLoaded] = useState(1);
    const firstSearch = useRef(true);

    // Загрузка начального состояния и восстановление query
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInitialState = async () => {
            setIsLoading(true);
            try {
                const savedQuery = localStorage.getItem('savedQuery') || '';
                setQuery(savedQuery);

                // Загружаем состояние и элементы параллельно
                const [serverState, { items: fetched }] = await Promise.all([
                    fetchState(savedQuery),
                    fetchItems({
                        q: savedQuery,
                        skip: 0,
                        limit: 20
                    })
                ]);

                if (serverState) {
                    setSelected(new Set(serverState.selected));
                    setPagesLoaded(serverState.pagesLoaded);
                }

                setItems(fetched);
                setTotal(total);
                setHasMore(fetched?.length < 1000000);

            } catch (error) {
                console.error('Ошибка загрузки:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialState();
    }, []);

    // Сохранение query при изменении
    useEffect(() => {
        localStorage.setItem('savedQuery', query);
    }, [query]);

    useEffect(() => {
        const handleSearch = async () => {
            if (firstSearch.current) {
                firstSearch.current = false;
                return;
            }

            const serverState = await fetchState(query);
            setSelected(new Set(serverState.selected));
            setPagesLoaded(serverState.pagesLoaded);

            const { items: fetched, total } = await fetchItems({
                skip: 0,
                limit: 20,
                q: query
            });

            setItems(fetched);
            setTotal(total);
            setHasMore(fetched?.length < total);
        };
        handleSearch();
    }, [query]);

    const loadMore = useCallback(async () => {
        const { items: more, total } = await fetchItems({
            skip: items?.length,
            limit: 20,
            q: query
        });

        const newItems = [...items, ...more];
        setItems(newItems);
        setPagesLoaded(p => p + 1);
        setHasMore(newItems.length < total);

        // await saveState(query, null, Array.from(selected), pagesLoaded + 1);
    }, [items, query, selected, pagesLoaded]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    const handleSelect = async (id: number, checked: boolean) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)

            // сразу сохраняем отмеченные элементы
            saveMove({
                q: query,
                movedId: null,
                beforeId: null,
                pagesLoaded,
                selected: Array.from(next),
            }).catch(console.error)

            return next
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIdx = items.findIndex(i => i.id === active.id);
        const newIdx = items.findIndex(i => i.id === over.id);
        const newItems = arrayMove(items, oldIdx, newIdx);
        setItems(newItems);

        // Находим beforeId — тот, ПЕРЕД кем надо вставить
        let beforeId: number | null = null;

        if (oldIdx < newIdx) {
            // Двигаем вниз — берём следующий элемент за over
            const afterOver = items[newIdx + 1];
            beforeId = afterOver?.id ?? null;
        } else {
            // Двигаем вверх — вставляем прямо перед over
            beforeId = items[newIdx].id;
        }

        await saveMove({
            q: query,
            movedId: Number(active.id),
            beforeId,
            pagesLoaded,
            selected: Array.from(selected),
        });
    };

    return (
        <div style={{width: 400, margin: '0 auto', paddingTop: 210}}>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'white',
                    padding: '20px 0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    textAlign: 'center'
                }}
            >
                <div style={{width: 400, margin: '0 auto'}}>
                    <SearchBar value={query} onChange={setQuery}/>
                    <h3>Всего элементов: {total}</h3>
                    <h3>Загружено: {items?.length}</h3>
                </div>
            </div>
            {isLoading ? (
                <div>Идет загрузка...</div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    {items && <SortableContext items={items?.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <InfiniteScroll
                            dataLength={items?.length}
                            next={loadMore}
                            hasMore={hasMore}
                            loader={<h4>Загрузка...</h4>}
                            /*scrollableTarget="window"*/
                        >
                            {items?.map(item => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    selected={selected.has(item.id)}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </InfiniteScroll>
                    </SortableContext>}
                </DndContext>
            )}
        </div>
    );
};