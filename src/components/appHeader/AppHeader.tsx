import { Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { SidebarTrigger } from "../sidebar/Sidebar";
import { Separator } from "../separator/Separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../breadcrumb/Breadcrumb";
import { ROUTES } from "../../app/routers/routes";

export const breadcrumbMap: Record<string, string> = {
  [ROUTES.homepage]: "Play",
  [ROUTES.checklists]: "Checklists",
  [ROUTES.clients]: "Clientes",
  [ROUTES.environments]: "Ambientes",
  [ROUTES.users]: "Usuários",
  [ROUTES.roles]: "Perfis",
  [ROUTES.permissions]: "Permissões",
};

function resolveBreadcrumbLabel(path: string, segment: string): string | null {
  if (breadcrumbMap[path]) {
    return breadcrumbMap[path];
  }

  if (segment === "criar") return "Criar";
  if (segment === "editar") return "Editar";

  if (/^\d+$/.test(segment)) {
    return null;
  }

  return null;
}

export function AppHeader() {
  const location = useLocation();

  const segments = location.pathname.split("/").filter(Boolean);

  const breadcrumbs = segments
    .map((_, index) => {
      const path = "/" + segments.slice(0, index + 1).join("/");
      return {
        path,
        label: resolveBreadcrumbLabel(path, segments[index]),
      };
    })
    .filter((b) => b.label);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger className="p-1" />

      <Separator orientation="vertical" className="mx-2 h-5" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={ROUTES.homepage}>
                <Home className="h-5 w-5" />
                <span className="sr-only">Play</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <p className="ml-auto text-xs text-muted-foreground">
        v1.0.3-beta-20261702
      </p>
    </header>
  );
}
