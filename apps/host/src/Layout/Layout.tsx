import type { JSX } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Car,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Home,
  type LucideIcon,
  Package,
  Wrench,
} from 'lucide-react';

import { RightBar } from '../shell/RightBar/RightBar';

import type { MfeConfigEntry } from '@-label-/contracts';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@-label-/ui-internal-core';

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Car,
  ExternalLink,
  FolderOpen,
  Home,
  Package,
  Wrench,
};

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const PageBreadcrumb = (): JSX.Element => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">MFE POC</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.length === 0 ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          segments.flatMap((segment, index) => {
            const path = '/' + segments.slice(0, index + 1).join('/');
            const isLast = index === segments.length - 1;
            return [
              <BreadcrumbSeparator key={`${path}-sep`} />,
              <BreadcrumbItem key={path}>
                {isLast ? (
                  <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{capitalize(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>,
            ];
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const ExternalLinkItem = ({ item }: { item: MfeConfigEntry }): JSX.Element => {
  const Icon = item.icon ? iconMap[item.icon] : undefined;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href={item.externalUrl} rel="noopener noreferrer" target="_blank">
          {Icon ? <Icon /> : null}
          <span>{item.label ?? item.name}</span>
          <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const SubmenuItem = ({ item }: { item: MfeConfigEntry }): JSX.Element => {
  const location = useLocation();
  const Icon = item.icon ? iconMap[item.icon] : undefined;
  const isPathActive = (path: string): boolean => location.pathname.startsWith(path);
  const isAnyActive = item.submenu?.some(sub => sub.path && isPathActive(sub.path)) ?? false;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isAnyActive}>
        {Icon ? <Icon /> : null}
        <span>{item.label ?? item.name}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
      </SidebarMenuButton>
      <SidebarMenuSub>
        {item.submenu?.map(sub => {
          const SubIcon = sub.icon ? iconMap[sub.icon] : undefined;
          return (
            <SidebarMenuSubItem key={sub.name}>
              <SidebarMenuSubButton asChild isActive={sub.path ? isPathActive(sub.path) : false}>
                <Link to={sub.path ?? '/'}>
                  {SubIcon ? <SubIcon /> : null}
                  <span>{sub.label ?? sub.name}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
};

const RegularLinkItem = ({ item }: { item: MfeConfigEntry }): JSX.Element => {
  const location = useLocation();
  const Icon = item.icon ? iconMap[item.icon] : undefined;
  const isActive = item.path ? location.pathname.startsWith(item.path) : false;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={item.path ?? '/'}>
          {Icon ? <Icon /> : null}
          <span>{item.label ?? item.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const renderMenuItem = (item: MfeConfigEntry): JSX.Element | null => {
  if (item.externalUrl) return <ExternalLinkItem item={item} key={item.name} />;
  if (item.submenu && item.submenu.length > 0) return <SubmenuItem item={item} key={item.name} />;
  if (item.path) return <RegularLinkItem item={item} key={item.name} />;
  return null;
};

const SidebarBrand = (): JSX.Element => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild size="lg">
        <Link to="/">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Home className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">MFE POC</span>
            <span className="text-xs">Module Federation</span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);

const SidebarNavigation = ({ mfes }: { mfes: MfeConfigEntry[] }): JSX.Element => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isHome}>
          <Link to="/">
            <Home />
            <span>Home</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {mfes.map(item => renderMenuItem(item))}
    </SidebarMenu>
  );
};

const AppSidebar = ({ mfes }: { mfes: MfeConfigEntry[] }): JSX.Element => {
  return (
    <Sidebar collapsible="icon" data-testid="app-sidebar">
      <SidebarHeader>
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNavigation mfes={mfes} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

const Layout = ({ mfes }: { mfes: MfeConfigEntry[] }): JSX.Element => {
  return (
    <SidebarProvider>
      <AppSidebar mfes={mfes} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4" data-testid="app-header">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mr-2 h-4" orientation="vertical" />
          <PageBreadcrumb />
        </header>
        <main className="flex-1 p-4" data-testid="app-main">
          <Outlet />
        </main>
      </SidebarInset>
      <RightBar configs={mfes} />
    </SidebarProvider>
  );
};

export default Layout;
