import { Outlet } from "react-router-dom";
import { AppHeader } from "../appHeader/AppHeader";
import { AppSidebar } from "../sidebar/AppSidebar";
import { SidebarProvider } from "../sidebar/Sidebar";

export const MainLayout = () => (
  <SidebarProvider>
    <AppSidebar /> 
    <main className="w-full">
      <AppHeader />
      <Outlet />
    </main>
  </SidebarProvider>
);