import { Link } from "react-router-dom";
// import { useAuth } from "../../app/provider/AuthProvider";
import { useTheme, type Theme } from "../../app/provider/ThemeProviderContext";
import { menus } from "./menus";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./Sidebar";

export const AppSidebar = () => {
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = () => {
    const next: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  // const navigate = useNavigate();
  // const isMobile = useIsMobile();
  // const { user, logout } = useAuth();

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     navigate("/login");
  //   } catch (error) {}
  // };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {
              menus.map((menu) => (
                // !!menu.subMenus?.length ? (
                //   <Collapsible
                //     key={menu.title}
                //     asChild
                //     defaultOpen={menu.isActive}
                //     className="group/collapsible"
                //   >
                //     <SidebarMenuItem>
                //       <CollapsibleTrigger asChild>
                //         <SidebarMenuButton
                //           tooltip={menu.title}
                //           className="truncate"
                //         >
                //           <menu.icon />
                //           <span>{menu.title}</span>
                //           <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                //         </SidebarMenuButton>
                //       </CollapsibleTrigger>
                //       <CollapsibleContent>
                //         <SidebarMenuSub>
                //           {menu.subMenus.map((subMenu) => (
                //             <SidebarMenuSubItem key={subMenu.title}>
                //               <SidebarMenuSubButton asChild>
                //                 <Link to={subMenu.url}>
                //                   <span>{subMenu.title}</span>
                //                 </Link>
                //               </SidebarMenuSubButton>
                //             </SidebarMenuSubItem>
                //           ))}
                //         </SidebarMenuSub>
                //       </CollapsibleContent>
                //     </SidebarMenuItem>
                //   </Collapsible>
                // ) : (
                <SidebarMenuItem key={menu.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={menu.title}
                    className="truncate"
                  >
                    <Link to={menu.url}>
                      <menu.icon />
                      <span>{menu.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
              // ,)
            }
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              onClick={handleToggleTheme}
              tooltip={theme === "dark" ? "Tema claro" : "Tema escuro"}
              className="truncate"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
              <span>{theme === "dark" ? "Dark" : "Light"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-background"
                >
                  {/* <Avatar>
                    <AvatarFallback>
                      {getInitials(getFirstAndLastWord(user?.name || ""))}
                    </AvatarFallback>
                  </Avatar> 
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.name ?? "Usuário Anônimo"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email ?? ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    {/* <Avatar>
                      <AvatarFallback>
                        {getInitials(getFirstAndLastWord(user?.name || ""))}
                      </AvatarFallback>
                    </Avatar> 
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.name ?? "Usuário Anônimo"}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email ?? ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 items-center hover:cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>*/}
      </SidebarFooter>
    </Sidebar>
  );
};
