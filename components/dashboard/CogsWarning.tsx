'use client';

/**
 * CogsWarning — Alert banner shown when COGS is still at the default value
 * and the user skipped COGS configuration during onboarding.
 * "Set up COGS" button navigates to the Product groups tab in Settings.
 */

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { useSettings } from '@/hooks/useSettings';
import { didSkipCogs } from '@/store/onboardStore';

const DEFAULT_COGS = 0.38;

/** Shows a warning banner when COGS is unconfigured. Hidden once the user sets it up. */
export default function CogsWarning(): React.JSX.Element | null {
  const { settings } = useSettings();
  const { toggleSettings, setSettingsTab } = useUIStore();

  const skipped = didSkipCogs();
  const isDefault = !settings || settings.cogs === DEFAULT_COGS;

  if (!skipped || !isDefault) return null;

  function handleSetupCogs(): void {
    setSettingsTab('products');
    toggleSettings();
  }

  return (
    <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-300">COGS not configured</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span>
          Your ROI numbers may be inaccurate. Costs are using a default estimate for clothing brands.
          Update your cost structure for accurate results.
        </span>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40 shrink-0"
          onClick={handleSetupCogs}
        >
          Set up COGS
        </Button>
      </AlertDescription>
    </Alert>
  );
}
