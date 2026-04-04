export function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2">
            <span className="text-gray-400 w-8 flex-shrink-0">{label}:</span>
            <span className="text-slate-600 break-all">{value}</span>
        </div>
    );
}
