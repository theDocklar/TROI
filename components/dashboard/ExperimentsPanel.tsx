'use client';

/**
 * ExperimentsPanel — A/B experiment list panel.
 * Displays all experiments with status badges and key metrics.
 * "+ New experiment" button opens the ExperimentCreator slide-in sheet.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOCK_EXPERIMENTS } from '@/lib/mockData';
import type { Experiment } from '@/types';
import ExperimentCreator from './ExperimentCreator';

function statusBadge(status: Experiment['status']): string {
  switch (status) {
    case 'running':   return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
    case 'planned':   return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function liftColor(lift: number): string {
  if (lift > 20) return 'text-green-600';
  if (lift > 0)  return 'text-amber-500';
  return 'text-muted-foreground';
}

/** Lists all A/B experiments and allows creating new ones via the ExperimentCreator. */
export default function ExperimentsPanel(): React.JSX.Element {
  const [experiments, setExperiments] = useState<Experiment[]>(MOCK_EXPERIMENTS);
  const [creatorOpen, setCreatorOpen] = useState(false);

  function handleSave(exp: Experiment): void {
    setExperiments((prev) => [exp, ...prev]);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Experiments</CardTitle>
            <Button size="sm" onClick={() => setCreatorOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New experiment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left px-6 py-3">Experiment</th>
                  <th className="text-left px-4 py-3">Channel</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Lift</th>
                  <th className="text-right px-4 py-3">Confidence</th>
                  <th className="text-right px-4 py-3">Spend</th>
                  <th className="text-right px-6 py-3">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {experiments.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium">{exp.name}</p>
                        {exp.hypothesis && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{exp.hypothesis}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{exp.channel}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs capitalize', statusBadge(exp.status))}>
                        {exp.status}
                      </Badge>
                    </td>
                    <td className={cn('text-right px-4 py-3 font-medium', liftColor(exp.lift))}>
                      {exp.lift > 0 ? `+${exp.lift}%` : '—'}
                    </td>
                    <td className="text-right px-4 py-3 text-muted-foreground">
                      {exp.confidence > 0 ? `${exp.confidence}%` : '—'}
                    </td>
                    <td className="text-right px-4 py-3">${exp.spend.toLocaleString()}</td>
                    <td className="text-right px-6 py-3 text-xs text-muted-foreground">
                      {exp.startDate} → {exp.endDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ExperimentCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
