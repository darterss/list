import React from 'react'
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ItemRowParams } from '../types'

export const ItemRow: React.FC<ItemRowParams> = ({ item, selected, onSelect }) => {
    if (!item) return null;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item.id,
        animateLayoutChanges: defaultAnimateLayoutChanges
    })

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        backgroundColor: isDragging
            ? '#e0f7fa'
            : selected
                ? '#d0f0c0'
                : '#fff',
        boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.2)' : undefined,
        display: 'flex',
        alignItems: 'center',
        padding: 8,
        border: '1px solid #ccc',
        marginBottom: 20,
        cursor: 'grab',
        position: 'relative'
    }

    return (
        <div ref={setNodeRef} style={style}>
            <input
                type="checkbox"
                checked={selected}
                onChange={(e) => {
                    e.stopPropagation()
                    onSelect(item.id, e.target.checked)
                }}
                style={{
                    marginRight: 8,
                    zIndex: 2, // Чекбокс поверх области перетаскивания
                    position: 'relative'
                }}
            />

            {/* Область перетаскивания */}
            <div
                {...attributes}
                {...listeners}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    paddingLeft: 32 // место для чекбокса
                }}
            >
                <span>{item.id}</span>
            </div>
        </div>
    )
}