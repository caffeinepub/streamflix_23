import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ApiKeySetup from "./components/ApiKeySetup";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { hasApiKey } from "./lib/tmdb";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import MoviesPage from "./pages/MoviesPage";
import SearchPage from "./pages/SearchPage";
import TVDetailPage from "./pages/TVDetailPage";
import TVPage from "./pages/TVPage";

function RootLayout() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const moviesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/movies",
  component: MoviesPage,
});

const tvRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tv",
  component: TVPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
});

const movieDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/movie/$id",
  component: MovieDetailPage,
});

const tvDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tv/$id",
  component: TVDetailPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  moviesRoute,
  tvRoute,
  searchRoute,
  movieDetailRoute,
  tvDetailRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [apiKeyReady, setApiKeyReady] = useState(hasApiKey());

  useEffect(() => {
    setApiKeyReady(hasApiKey());
  }, []);

  if (!apiKeyReady) {
    return <ApiKeySetup onSaved={() => setApiKeyReady(true)} />;
  }

  return <RouterProvider router={router} />;
}
