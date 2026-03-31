import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useState } from "react";
import ApiKeySetup from "./components/ApiKeySetup";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SignInModal from "./components/SignInModal";
import { AuthProvider } from "./contexts/AuthContext";
import { hasApiKey } from "./lib/tmdb";
import ContinueWatchingPage from "./pages/ContinueWatchingPage";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import MoviesPage from "./pages/MoviesPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import TVDetailPage from "./pages/TVDetailPage";
import TVPage from "./pages/TVPage";
import WatchMoviePage from "./pages/WatchMoviePage";
import WatchTVPage from "./pages/WatchTVPage";

function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      window.scrollTo(0, 0);
    }
  });

  return null;
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isWatchPage = pathname.startsWith("/watch");

  return (
    <div className={`bg-[#0B0B0B] min-h-screen${isWatchPage ? "" : " pb-14"}`}>
      <ScrollToTop />
      {!isWatchPage && <Navbar />}
      <Outlet />
      {!isWatchPage && <Footer />}
      {!isWatchPage && <BottomNav />}
      <SignInModal />
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

const watchMovieRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watch/movie/$id",
  component: WatchMoviePage,
});

const watchTVRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watch/tv/$id/$season/$episode",
  component: WatchTVPage,
});

const continueWatchingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/continue-watching",
  component: ContinueWatchingPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  moviesRoute,
  tvRoute,
  searchRoute,
  movieDetailRoute,
  tvDetailRoute,
  watchMovieRoute,
  watchTVRoute,
  continueWatchingRoute,
  profileRoute,
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

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
