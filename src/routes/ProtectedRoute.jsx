// routes/ProtectedRoute.jsx
// Protege rutas por: rol, permiso, y feature de suscripción.
//
// Uso:
//   <ProtectedRoute roles={["admin"]}> → solo por rol
//   <ProtectedRoute permission="expense.read"> → solo por permiso
//   <ProtectedRoute feature="analytics"> → requiere feature del plan
//   <ProtectedRoute roles={["admin"]} feature="api_access"> → ambos
//
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";

export default function ProtectedRoute({
  children,
  permission,
  roles,
  feature,            // ← nuevo: feature de suscripción requerida
  redirectTo = "/",
  featureRedirect = "/subscription",  // a dónde ir si falta el feature
}) {
  const { user, can, isSuperAdmin, isAuthenticated } = useAuth();
  const { canUse } = useSubscription();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Superadmin bypasea todo — igual que backend
  if (isSuperAdmin()) return children;

  // Normalizar roles del usuario
  const userRoles = (user?.roles ?? []).map(r =>
    typeof r === "object" && r !== null ? r.name : r
  );

  // Verificar rol
  if (roles?.length) {
    const allowedByRole = roles.some(r => userRoles.includes(r));
    if (!allowedByRole) return <Navigate to={redirectTo} replace />;
  }

  // Verificar permiso
  if (permission && !can(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar feature de suscripción
  if (feature && !canUse(feature)) {
    return <Navigate to={featureRedirect} replace />;
  }

  return children;
}