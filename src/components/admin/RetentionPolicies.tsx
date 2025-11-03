import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Clock, Archive, Trash2, AlertCircle, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { RetentionPolicy, RetentionPeriod } from '@/lib/fileQuality';
import { RETENTION_PERIODS, checkRetentionStatus } from '@/lib/fileQuality';

export function RetentionPolicies() {
  const [policy, setPolicy] = useState<RetentionPolicy>({
    period: '1year',
    action: 'warn',
    enabled: false
  });
  const [affectedRecords, setAffectedRecords] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPolicy();
    calculateAffectedRecords();
  }, [policy.period]);

  const loadPolicy = async () => {
    // In a real app, load from database/settings
    const savedPolicy = localStorage.getItem('retentionPolicy');
    if (savedPolicy) {
      setPolicy(JSON.parse(savedPolicy));
    }
  };

  const calculateAffectedRecords = async () => {
    try {
      const { data: records } = await supabase
        .from('upload_records')
        .select('created_at');

      if (records) {
        const affected = records.filter(record => {
          const status = checkRetentionStatus(record.created_at, policy);
          return status.shouldAction;
        });
        setAffectedRecords(affected.length);
      }
    } catch (error) {
      console.error('Error calculating affected records:', error);
    }
  };

  const handleSavePolicy = () => {
    setIsLoading(true);
    localStorage.setItem('retentionPolicy', JSON.stringify(policy));
    toast.success('Retention policy updated successfully');
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleApplyPolicy = async () => {
    if (!policy.enabled) {
      toast.error('Please enable the policy first');
      return;
    }

    setIsLoading(true);
    try {
      const { data: records } = await supabase
        .from('upload_records')
        .select('id, created_at, no_surat_jalan');

      if (records) {
        const toProcess = records.filter(record => {
          const status = checkRetentionStatus(record.created_at, policy);
          return status.shouldAction;
        });

        if (policy.action === 'delete') {
          // In production, implement proper deletion
          toast.warning(`Would delete ${toProcess.length} records (simulation mode)`);
        } else if (policy.action === 'archive') {
          toast.success(`Would archive ${toProcess.length} records (simulation mode)`);
        } else {
          toast.info(`${toProcess.length} records flagged for review`);
        }
      }
    } catch (error) {
      console.error('Error applying policy:', error);
      toast.error('Failed to apply retention policy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Retention Policies</h2>
          <p className="text-sm text-muted-foreground">
            Automatically manage old records based on age
          </p>
        </div>
        <Badge variant={policy.enabled ? 'default' : 'secondary'} className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {policy.enabled ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${policy.enabled ? 'bg-brand/10' : 'bg-muted'}`}>
              <Clock className={`h-4 w-4 ${policy.enabled ? 'text-brand' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <Label htmlFor="policy-enabled" className="text-sm font-medium">
                Enable Retention Policy
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically process records based on age
              </p>
            </div>
          </div>
          <Switch
            id="policy-enabled"
            checked={policy.enabled}
            onCheckedChange={(enabled) => setPolicy({ ...policy, enabled })}
          />
        </div>

        {/* Retention Period */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Retention Period</Label>
          <Select
            value={policy.period}
            onValueChange={(period) => setPolicy({ ...policy, period: period as RetentionPeriod })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days (3 months)</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="2years">2 Years</SelectItem>
              <SelectItem value="forever">Forever (No deletion)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Records older than this period will be processed
          </p>
        </div>

        {/* Action Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Action</Label>
          <Select
            value={policy.action}
            onValueChange={(action) => setPolicy({ ...policy, action: action as 'archive' | 'delete' | 'warn' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  Warn Only
                </div>
              </SelectItem>
              <SelectItem value="archive">
                <div className="flex items-center gap-2">
                  <Archive className="h-3 w-3" />
                  Archive Records
                </div>
              </SelectItem>
              <SelectItem value="delete">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-3 w-3" />
                  Delete Records
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Affected Records Warning */}
        {affectedRecords > 0 && policy.enabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border-2 border-amber-500/50 bg-amber-500/10"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {affectedRecords} record{affectedRecords !== 1 ? 's' : ''} will be affected
                </p>
                <p className="text-xs text-muted-foreground">
                  These records are older than {RETENTION_PERIODS[policy.period]} days and will be {policy.action === 'delete' ? 'deleted' : policy.action === 'archive' ? 'archived' : 'flagged'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSavePolicy}
            disabled={isLoading}
            className="flex-1"
          >
            Save Policy
          </Button>
          <Button
            onClick={handleApplyPolicy}
            variant="outline"
            disabled={isLoading || !policy.enabled || affectedRecords === 0}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Apply Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
