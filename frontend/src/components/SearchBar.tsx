import type {FC} from 'react'

interface Props {
    value: string
    onChange: (v: string) => void
}

export const SearchBar: FC<Props> = ({ value, onChange }) => (
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
