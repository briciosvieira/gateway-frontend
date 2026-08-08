import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AdminLayout } from '@/layouts/admin-layout';
import { SettingsLayout } from '@/layouts/settings-layout';
import { AllowedIpsPage } from '@/pages/allowed-ips/allowed-ips-page';
import { ApiKeysPage } from '@/pages/api-keys/api-keys-page';
import { AuditLogsPage } from '@/pages/audit-logs/audit-logs-page';
import { ChangePasswordPage } from '@/pages/change-password/change-password-page';
import { ClientsPage } from '@/pages/clients/clients-page';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';
import { ForbiddenPage } from '@/pages/forbidden/forbidden-page';
import { GatewayRoutesPage } from '@/pages/gateway-routes/gateway-routes-page';
import { HomePage } from '@/pages/home/home-page';
import { LoginPage } from '@/pages/login/login-page';
import { NotFoundPage } from '@/pages/not-found/not-found-page';
import { PlaceholderPage } from '@/pages/placeholder/placeholder-page';
import { RequestLogsPage } from '@/pages/request-logs/request-logs-page';
import { RouteHeadersPage } from '@/pages/route-headers/route-headers-page';
import { CertificatesPage } from '@/pages/settings/certificates-page';
import { PersonalizationPage } from '@/pages/settings/personalization-page';
import { UsersPage } from '@/pages/users/users-page';
import { FirstLoginRoute } from '@/routes/first-login-route';
import { NAV_ITEMS } from '@/routes/nav-items';
import { PermissionRoute } from '@/routes/permission-route';
import { ProtectedRoute } from '@/routes/protected-route';
import { PublicRoute } from '@/routes/public-route';
import { SettingsIndexRedirect } from '@/routes/settings-index-redirect';

const placeholderRoutes = NAV_ITEMS.filter(
  (item) =>
    item.path !== '/' &&
    item.path !== '/dashboard' &&
    item.path !== '/clients' &&
    item.path !== '/api-keys' &&
    item.path !== '/allowed-ips' &&
    item.path !== '/gateway-routes' &&
    item.path !== '/route-headers' &&
    item.path !== '/audit-logs' &&
    item.path !== '/request-logs' &&
    item.path !== '/settings',
).map((item) => ({
  path: item.path,
  element: <PlaceholderPage titleKey={item.labelKey} icon={item.icon} />,
}));

export const appRouter = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <FirstLoginRoute />,
    children: [{ path: '/change-password', element: <ChangePasswordPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          // Usuários moved under Configurações (/settings/users) — this
          // keeps old bookmarks/links working instead of a dead 404.
          { path: '/users', element: <Navigate to="/settings/users" replace /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/api-keys', element: <ApiKeysPage /> },
          { path: '/allowed-ips', element: <AllowedIpsPage /> },
          { path: '/gateway-routes', element: <GatewayRoutesPage /> },
          {
            element: <PermissionRoute permission="routeHeaders.read" />,
            children: [{ path: '/route-headers', element: <RouteHeadersPage /> }],
          },
          {
            element: <PermissionRoute permission="auditLogs.read" />,
            children: [{ path: '/audit-logs', element: <AuditLogsPage /> }],
          },
          {
            element: <PermissionRoute permission="requestLogs.read" />,
            children: [{ path: '/request-logs', element: <RequestLogsPage /> }],
          },
          {
            // Entry into Configurações at all — ADMIN + OPERATOR. Each
            // subsection below applies its own, stricter inner gate; this
            // outer one does not imply access to every subsection.
            element: <PermissionRoute permission="settings.read" />,
            children: [
              {
                path: '/settings',
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <SettingsIndexRedirect /> },
                  {
                    element: <PermissionRoute permission="trustedCas.read" />,
                    children: [{ path: 'certificates', element: <CertificatesPage /> }],
                  },
                  { path: 'personalization', element: <PersonalizationPage /> },
                  {
                    element: <PermissionRoute permission="users.read" />,
                    children: [{ path: 'users', element: <UsersPage /> }],
                  },
                ],
              },
            ],
          },
          ...placeholderRoutes,
        ],
      },
    ],
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
