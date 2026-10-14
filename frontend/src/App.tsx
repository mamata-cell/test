import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";

export function App() {
  return (
    <Routes>
      {/* The landing page renders STANDALONE — not inside <Layout>. It ships its own
          header, so nesting it in the app shell stacks two headers on `/`. Every
          AUTHENTICATED route belongs inside <Layout> below. */}
      <Route path="/" element={<Home />} />

    </Routes>
  );
}
