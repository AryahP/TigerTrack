export default function Tag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center bg-gray-200 text-gray-800 rounded px-2 py-1 mr-2 mb-2">
      {label}
      <button onClick={onRemove} className="ml-1 text-gray-500 hover:text-gray-700">&times;</button>
    </span>
  )
}