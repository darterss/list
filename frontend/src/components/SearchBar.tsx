import type { FC } from 'react'
import type { SearchParams } from "../types.ts";

export const SearchBar: FC<SearchParams> = ({ value, onChange }) => (
    <input
        type="text"
        placeholder="Поиск по ID..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
            width: '100%',
            padding: '8px',
            marginBottom: '12px',
            fontSize: '16px'
        }}
    />
)
