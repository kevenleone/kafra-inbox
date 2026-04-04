export function NoContent({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center h-full py-20 text-gray-400">
            <p className="text-sm">{message}</p>
        </div>
    );
}
