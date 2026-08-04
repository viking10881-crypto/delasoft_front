// src/App.jsx — con SubscriptionProvider y feature gates en rutas
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }         from "./context/AuthContext";
import { ThemeProvider }        from "./context/ThemeContext";
import { NoticeProvider }       from "./context/NoticeContext";
import { ChatProvider }         from "./context/ChatContext";
import { SocketProvider }       from "./context/SocketContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { Toaster }              from "react-hot-toast";

import Login           from "./pages/Login";
import Dashboard       from "./pages/Dashboard";
import Products        from "./pages/Products";
import ProductDetail    from "./components/products/ProductDetail"; // ← nuevo import
import Sales           from "./pages/Sales";
import Analytics       from "./pages/Analytics";
import SalesHistory    from "./pages/SalesHistory";
import Procurement            from "./pages/Procurement";
import NotificationSettings   from "./pages/tools/NotificationSettings";
import Tools                  from "./pages/Tools";
import Banners         from "./pages/tools/Banners";
import Users           from "./pages/Users";
import Admins          from "./pages/Admins";
import Finance         from "./pages/tools/Finance";
import Discounts       from "./pages/tools/Discounts";
import Categories      from "./pages/tools/Categories";
import Providers       from "./pages/tools/Providers";
import ContactMessages from "./pages/tools/ContactMessages";
import AdminReviews    from "./pages/tools/AdminReviews";
import Agent           from "./pages/tools/Agent";
import BusinessProfile from "./pages/tools/BusinessProfile";
import Chat            from "./pages/tools/Chat";
import Settings        from "./pages/tools/Settings";
import Inventory       from "./pages/tools/Inventory";
import Setup           from "./pages/Setup";
import ApiKeys            from "./pages/tools/ApiKeys";
import AppearanceSettings from "./pages/tools/AppearanceSettings";
import PaymentAccount  from "./pages/tools/PaymentAccount";
import MySubscription  from "./pages/MySubscription";
import Pricing         from "./pages/Pricing";
import Prospects       from "./pages/Prospects";
import SubscriptionOrders from "./pages/SubscriptionOrders";

import PrivateRoute    from "./routes/PrivateRoute";
import ProtectedRoute  from "./routes/ProtectedRoute";
import MainLayout      from "./components/MainLayout";
import AutoLogout      from "./components/AutoLogout";

function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <p className="text-8xl font-black" style={{ color: "var(--brand)" }}>404</p>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Página no encontrada
      </h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        La ruta que buscas no existe o fue movida.
      </p>
      <a
        href="/"
        className="px-6 py-3 rounded-2xl font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--brand)" }}
      >
        Volver al inicio
      </a>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <SocketProvider>
            <NoticeProvider>
              <ChatProvider>
                <BrowserRouter>
                  <Toaster position="top-center" reverseOrder={false} />
                  <AutoLogout>
                    <Routes>
                      <Route path="/login" element={<Login />} />

                      <Route
                        element={
                          <PrivateRoute>
                            <MainLayout />
                          </PrivateRoute>
                        }
                      >
                        {/* ── Siempre visibles ── */}
                        <Route path="/"             element={<Dashboard />} />
                        <Route path="/products"     element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/sales"        element={<Sales />} />
                        <Route path="/history"      element={<SalesHistory />} />
                        <Route path="/procurement"  element={
                          <ProtectedRoute feature="purchase_orders">
                            <Procurement />
                          </ProtectedRoute>
                        } />

                        {/* ── Mi suscripción ── */}
                        <Route path="/subscription" element={<MySubscription />} />
                        <Route path="/pricing"      element={<Pricing />} />

                        {/* ── Analytics ── */}
                        <Route path="/analytics" element={
                          <ProtectedRoute feature="analytics">
                            <Analytics />
                          </ProtectedRoute>
                        } />

                        {/* ── Usuarios ── */}
                        <Route path="/users" element={
                          <ProtectedRoute permission="user.read">
                            <Users />
                          </ProtectedRoute>
                        } />

                        {/* ── Admins ── */}
                        <Route path="/admins" element={
                          <ProtectedRoute roles={["superadmin", "admin"]} feature="multi_admin">
                            <Admins />
                          </ProtectedRoute>
                        } />

                        <Route path="/prospects" element={
                          <ProtectedRoute roles={["superadmin"]}>
                            <Prospects />
                          </ProtectedRoute>
                        } />
                        <Route path="/subscription-orders" element={
                          <ProtectedRoute roles={["superadmin"]}>
                            <SubscriptionOrders />
                          </ProtectedRoute>
                        } />

                        {/* ── Setup ── */}
                        <Route path="/setup" element={
                          <ProtectedRoute roles={["superadmin"]}>
                            <Setup />
                          </ProtectedRoute>
                        } />

                        {/* ── Herramientas ── */}
                        <Route path="/tools">
                          <Route index element={<Tools />} />
                          <Route path="chat"     element={<Chat />} />
                          <Route path="banners"  element={
                            <ProtectedRoute roles={["superadmin", "admin"]}>
                              <Banners />
                            </ProtectedRoute>
                          } />
                          <Route path="agent" element={
                            <ProtectedRoute feature="ai_agent">
                              <Agent />
                            </ProtectedRoute>
                          } />
                          <Route path="finance" element={
                            <ProtectedRoute permission="expense.read" feature="financial_reports">
                              <Finance />
                            </ProtectedRoute>
                          } />
                          <Route path="providers" element={
                            <ProtectedRoute permission="provider.read" feature="purchase_orders">
                              <Providers />
                            </ProtectedRoute>
                          } />
                          <Route path="inventory" element={
                            <ProtectedRoute feature="inventory">
                              <Inventory />
                            </ProtectedRoute>
                          } />
                          <Route path="procurement" element={
                            <ProtectedRoute feature="purchase_orders">
                              <Procurement />
                            </ProtectedRoute>
                          } />
                          <Route path="discounts" element={
                            <ProtectedRoute roles={["superadmin", "admin"]} feature="discount_system">
                              <Discounts />
                            </ProtectedRoute>
                          } />
                          <Route path="categories" element={
                            <ProtectedRoute permission="product.read">
                              <Categories />
                            </ProtectedRoute>
                          } />
                          <Route path="contact-messages" element={
                            <ProtectedRoute roles={["superadmin", "admin"]}>
                              <ContactMessages />
                            </ProtectedRoute>
                          } />
                          <Route path="notifications" element={
                            <ProtectedRoute roles={["superadmin", "admin"]}>
                              <NotificationSettings />
                            </ProtectedRoute>
                          } />
                          <Route path="reviews" element={
                            <ProtectedRoute roles={["superadmin", "admin"]}>
                              <AdminReviews />
                            </ProtectedRoute>
                          } />

                          {/* ── Settings con sus hijos ── */}
                          <Route path="settings" element={<Settings />}>
                            <Route path="business-profile" element={
                              <ProtectedRoute roles={["superadmin", "admin"]} feature="custom_branding">
                                <BusinessProfile />
                              </ProtectedRoute>
                            } />
                            <Route path="appearance" element={
                              <ProtectedRoute roles={["superadmin", "admin"]}>
                                <AppearanceSettings />
                              </ProtectedRoute>
                            } />
                            <Route path="api-keys" element={
                              <ProtectedRoute roles={["superadmin", "admin"]} feature="api_access">
                                <ApiKeys />
                              </ProtectedRoute>
                            } />
                            <Route path="payments" element={
                              <ProtectedRoute roles={["superadmin", "admin"]}>
                                <PaymentAccount />
                              </ProtectedRoute>
                            } />
                            <Route path="notifications" element={
                              <ProtectedRoute roles={["superadmin", "admin"]}>
                                <NotificationSettings />
                              </ProtectedRoute>
                            } />
                          </Route>

                        </Route>
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AutoLogout>
                </BrowserRouter>
              </ChatProvider>
            </NoticeProvider>
          </SocketProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
