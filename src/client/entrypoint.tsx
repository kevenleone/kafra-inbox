import { createRoot } from "react-dom/client";

import App from "./App";

export function KafraInboxEntryPoint() {
    return <App />;
}

const root = createRoot(document.getElementById("root")!);

root.render(<KafraInboxEntryPoint />);
