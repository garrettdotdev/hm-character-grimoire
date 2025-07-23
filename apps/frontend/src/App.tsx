import { useEffect } from "react";
import { GrimoirePage } from "./pages/GrimoirePage.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { NotificationContainer } from "./components/NotificationContainer.js";
import { useNotificationStore } from "./stores/notificationStore.js";
import { api, ApiError } from "./services/api.js";
import "./App.css";

function App() {
  const { showError } = useNotificationStore();

  useEffect(() => {
    // Set up global error handler for API errors
    api.setErrorHandler((error: ApiError) => {
      const message = error.message || 'An unexpected error occurred';
      showError(message, 5000);
    });
  }, [showError]);

  return (
    <ErrorBoundary>
      <GrimoirePage />
      <NotificationContainer />
    </ErrorBoundary>
  );
}

export default App;
