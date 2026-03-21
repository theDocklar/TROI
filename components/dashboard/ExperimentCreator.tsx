'use client';

/**
 * ExperimentCreator — slide-in sheet for creating a new A/B experiment.
 * Validates name + budget, shows live revenue projections, and fires a toast on save.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Channel, Experiment } from '@/types';

// Historical averages from MOCK experiment data and campaign metrics
const CHANNEL_AVG_LIFT: Record<Channel, number> = {
  Meta:   8.1,
  Google: 10.9,
  TikTok: 27.8,
  Email:  20.5,
};
const CHANNEL_AVG_ROAS: Record<Channel, number> = {
  Meta:   3.2,
  Google: 4.1,
  TikTok: 3.8,
  Email:  32,
};

interface FormState {
  name: string;
  channel: Channel;
  split: number;
  budget: string;
  duration: string;
  hypothesis: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (experiment: Experiment) => void;
}

/** Slide-in sheet for creating a new A/B experiment with live projections. */
export default function ExperimentCreator({ open, onClose, onSave }: Props): React.JSX.Element {
  const [form, setForm] = useState<FormState>({
    name: '',
    channel: 'TikTok',
    split: 20,
    budget: '',
    duration: '14',
    hypothesis: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Live projections
  const [projRevenue, setProjRevenue] = useState(0);
  const [daysToConfidence, setDaysToConfidence] = useState(21);

  useEffect(() => {
    const b = parseFloat(form.budget) || 0;
    const roas = CHANNEL_AVG_ROAS[form.channel];
    const lift = CHANNEL_AVG_LIFT[form.channel];
    setProjRevenue(Math.round(b * roas * (lift / 100)));
    setDaysToConfidence(Math.max(7, Math.round(21 - b / 500)));
  }, [form.channel, form.budget]);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    const b = parseFloat(form.budget);
    if (isNaN(b) || b <= 0) errs.budget = 'Enter a budget greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave(): void {
    if (!validate()) return;
    const experiment: Experiment = {
      id: `e${Date.now()}`,
      name: form.name.trim(),
      channel: form.channel,
      status: 'planned',
      testRev: 0,
      controlRev: 0,
      spend: parseFloat(form.budget),
      startDate: 'Upcoming',
      endDate: `+${form.duration}d`,
      lift: 0,
      confidence: 0,
      hypothesis: form.hypothesis,
    };
    onSave(experiment);
    toast.success('Experiment created');
    onClose();
    setForm({ name: '', channel: 'TikTok', split: 20, budget: '', duration: '14', hypothesis: '' });
    setErrors({});
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New experiment</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-name">Experiment name *</Label>
            <Input
              id="exp-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. TikTok UGC vs. Studio"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v as Channel }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['Meta', 'Google', 'TikTok', 'Email'] as Channel[]).map((ch) => (
                  <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test split */}
          <div className="space-y-2">
            <Label>
              Test split — {100 - form.split}% control / {form.split}% test
            </Label>
            <Slider
              min={10}
              max={40}
              step={5}
              value={[form.split]}
              onValueChange={([v]) => setForm((f) => ({ ...f, split: v }))}
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-budget">Budget for test period ($) *</Label>
            <Input
              id="exp-budget"
              type="number"
              min="1"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              placeholder="e.g. 2000"
            />
            {errors.budget && <p className="text-xs text-red-500">{errors.budget}</p>}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select value={form.duration} onValueChange={(v) => setForm((f) => ({ ...f, duration: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['7', '14', '21', '28'].map((d) => (
                  <SelectItem key={d} value={d}>{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hypothesis */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-hypothesis">
              Hypothesis{' '}
              <span className="text-muted-foreground font-normal">
                ({form.hypothesis.length}/200)
              </span>
            </Label>
            <Textarea
              id="exp-hypothesis"
              maxLength={200}
              rows={3}
              value={form.hypothesis}
              onChange={(e) => setForm((f) => ({ ...f, hypothesis: e.target.value }))}
              placeholder="What do you expect to learn?"
            />
          </div>

          {/* Live projections */}
          {parseFloat(form.budget) > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-1 text-sm">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Projections
                </p>
                <p>Projected incremental revenue: <strong>${projRevenue.toLocaleString()}</strong></p>
                <p>Est. days to 85% confidence: <strong>{daysToConfidence}</strong></p>
                <p>Historical lift for {form.channel}: <strong>{CHANNEL_AVG_LIFT[form.channel]}%</strong></p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save experiment</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
