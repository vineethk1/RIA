// src/App.js
import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const Home = lazy(() => import("./pages/Home/Home"));
const Health = lazy(() => import("./pages/Health/Health"));
const DocsPage = lazy(() => import("./pages/Docs/Docs"));

function RouteError() {
  return (
    <div style={{ padding: 24, color: "#eef3ff" }}>
      <h2>Something went sideways.</h2>
      <p>Try refreshing. If it persists, check your console for details.</p>
    </div>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <Home />, errorElement: <RouteError /> },
  { path: "/health", element: <Health />, errorElement: <RouteError /> },
  { path: "/docs", element: <DocsPage />, errorElement: <RouteError /> },
  { path: "*", element: <div style={{ padding: 24 }}>Not found</div> },
]);

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
