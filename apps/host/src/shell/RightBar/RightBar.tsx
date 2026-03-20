import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { MfeErrorBoundary } from '../../MfeErrorBoundary/MfeErrorBoundary';
import { useShellApi } from '../ShellApiProvider/ShellApiProvider';

import type { MfeConfigEntry, MfePanelConfig } from '@-label-/contracts';
import { lazyRemoteComponent } from '@-label-/mfe-loader';
import type { RightBarSliceState } from '@-label-/shell-core';
import { useShellStore } from '@-label-/shell-hooks';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@-label-/ui-internal-core';

// ── Panel Size Map ──────────────────────────────────────────

const SIZE_MAP: Record<string, string> = {
  lg: 'sm:max-w-[640px]',
  md: 'sm:max-w-[480px]',
  sm: 'sm:max-w-[320px]',
};

// ── Panel Registry ──────────────────────────────────────────

interface PanelRegistryEntry {
  panelId: string;
  title: string;
  size: string;
  remoteName: string;
  entry: string;
  module: string;
}

const buildPanelRegistry = (configs: readonly MfeConfigEntry[]): Map<string, PanelRegistryEntry> => {
  const registry = new Map<string, PanelRegistryEntry>();
  for (const mfeConfig of configs) {
    // Recurse into submenu items
    if (mfeConfig.submenu && mfeConfig.submenu.length > 0) {
      const subRegistry = buildPanelRegistry(mfeConfig.submenu);
      for (const [key, value] of subRegistry) {
        registry.set(key, value);
      }
      continue;
    }
    const panels = (mfeConfig.panels ?? []) as MfePanelConfig[];
    for (const panel of panels) {
      registry.set(panel.panelId, {
        entry: mfeConfig.entry,
        module: panel.module,
        panelId: panel.panelId,
        remoteName: mfeConfig.name,
        size: panel.size ?? 'md',
        title: panel.title,
      });
    }
  }
  return registry;
};

// ── Selectors ───────────────────────────────────────────────

const selectTopPanel = (s: { rightBar: { stack: readonly { panelId: string; payload: Record<string, unknown> }[] } }) => {
  return s.rightBar.stack.at(-1) ?? null;
};

// ── Panel Content (lazy loaded) ─────────────────────────────

// Create lazy component outside render to satisfy react-hooks/static-components
const panelComponentCache = new Map<string, React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>>();

const getOrCreatePanelComponent = (entry: PanelRegistryEntry) => {
  const key = `${entry.remoteName}::${entry.module}`;
  const cached = panelComponentCache.get(key);
  if (cached) return cached;
  const component = lazyRemoteComponent<Record<string, unknown>>({ moduleName: entry.module, remoteName: entry.remoteName });
  panelComponentCache.set(key, component);
  return component;
};

const PanelContent = ({
  component,
  entry,
}: {
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  entry: PanelRegistryEntry;
}): React.JSX.Element => {
  const shellApi = useShellApi();
  const topPanel = useShellStore(
    selectTopPanel as (s: Record<string, unknown>) => { panelId: string; payload: Record<string, unknown> } | null,
  );
  const Component = component;

  return (
    <MfeErrorBoundary name={entry.title}>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading panel...</p>}>
        <Component payload={topPanel?.payload ?? {}} shellApi={shellApi} />
      </Suspense>
    </MfeErrorBoundary>
  );
};

// ── Panel URL Sync (Zustand master, URL mirror) ────────────

const usePanelUrlSync = (): void => {
  const [searchParameters, setSearchParameters] = useSearchParams();
  const shellApi = useShellApi();
  const isOpen = useShellStore(s => (s as unknown as RightBarSliceState).rightBar.isOpen);
  const topPanel = useShellStore(
    selectTopPanel as (s: Record<string, unknown>) => { panelId: string; payload: Record<string, unknown> } | null,
  );

  const mountedRef = useRef(false);

  // URL → Zustand: one-shot read on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const panelId = searchParameters.get('panel.id');
    const entityId = searchParameters.get('panel.entityId');
    if (panelId) {
      const payload: Record<string, unknown> = {};
      if (entityId) payload.id = entityId;
      shellApi.openPanel({ panelId, payload });
    }
  }, [searchParameters, shellApi]);

  // Zustand → URL: mirror panel state to URL params
  useEffect(() => {
    if (!mountedRef.current) return;

    setSearchParameters(
      previous => {
        if (isOpen && topPanel) {
          previous.set('panel.id', topPanel.panelId);
          const entityId = topPanel.payload.id;
          if (entityId && typeof entityId === 'string') {
            previous.set('panel.entityId', entityId);
          } else {
            previous.delete('panel.entityId');
          }
        } else {
          previous.delete('panel.id');
          previous.delete('panel.entityId');
        }
        return previous;
      },
      { replace: true },
    );
  }, [isOpen, topPanel, setSearchParameters]);
};

// ── RightBar Component ──────────────────────────────────────

export const RightBar = ({ configs }: { configs: readonly MfeConfigEntry[] }): React.JSX.Element => {
  usePanelUrlSync();

  const isOpen = useShellStore(s => (s as unknown as RightBarSliceState).rightBar.isOpen);
  const topPanel = useShellStore(
    selectTopPanel as (s: Record<string, unknown>) => { panelId: string; payload: Record<string, unknown> } | null,
  );
  const closePanel = useShellStore(s => (s as unknown as RightBarSliceState).closePanel);

  const registry = useMemo(() => buildPanelRegistry(configs), [configs]);
  const currentEntry = topPanel ? registry.get(topPanel.panelId) : null;
  const sizeClass = currentEntry ? (SIZE_MAP[currentEntry.size] ?? SIZE_MAP.md) : SIZE_MAP.md;
  const panelComponent = useMemo(() => (currentEntry ? getOrCreatePanelComponent(currentEntry) : null), [currentEntry]);

  return (
    <Sheet
      onOpenChange={open => {
        if (!open) closePanel();
      }}
      open={isOpen}
    >
      <SheetContent className={sizeClass} side="right">
        <SheetHeader>
          <SheetTitle>{currentEntry?.title ?? 'Panel'}</SheetTitle>
          <SheetDescription className="sr-only">{currentEntry?.title ?? 'Panel'} details</SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex-1 overflow-y-auto">
          {currentEntry && panelComponent ? <PanelContent component={panelComponent} entry={currentEntry} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
