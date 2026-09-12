interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function SearchBar({ value, onChange, disabled }: SearchBarProps) {
  return (
    <div className="border-b border-gray-200 px-3 py-2">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search strings..."
        className="w-full max-w-sm rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
      />
    </div>
  );
}
