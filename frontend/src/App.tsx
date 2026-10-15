import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Account } from "./pages/Account";
import { Contact } from "./pages/Contact";
import { Layout } from "./components/Layout";
import { RequireAuth } from "./components/RequireAuth";

export function App() {
  return (
    <Routes>
      {/* The landing page renders STANDALONE — not inside <Layout>. It ships its own
          header, so nesting it in the app shell stacks two headers on `/`. Every
          AUTHENTICATED route belongs inside <Layout> below. */}
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/sign-in" element={<Login />} />
      <Route path="/login" element={<Navigate to="/sign-in" replace />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/account" element={<Account />} />
      </Route>
      <Route path="*" element={<div data-lg-key="5ba046afde" className="site-container page-not-found"><h1 data-lg-key="bc333f5292">Page not found</h1><a data-lg-key="a8b9f8881f" className="text-link" href="/">Return Home</a></div>} />
    </Routes>
  );
}
