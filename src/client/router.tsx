import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "./App";
import { GuestOnly } from "./components/guest-only";
import { RequireAuth } from "./components/require-auth";
import { Login } from "./components/ui/login";
import { Onboarding } from "./components/ui/onboarding";

export function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/setup"
                    element={
                        <GuestOnly>
                            <Onboarding />
                        </GuestOnly>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <GuestOnly>
                            <Login />
                        </GuestOnly>
                    }
                />
                <Route
                    path="/*"
                    element={
                        <RequireAuth>
                            <App />
                        </RequireAuth>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
