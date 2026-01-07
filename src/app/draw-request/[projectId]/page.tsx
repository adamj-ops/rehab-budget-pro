'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toast, Toaster } from 'sonner';
import {
  IconCheck,
  IconLoader2,
  IconBuildingStore,
  IconReceipt,
  IconAlertCircle,
} from '@tabler/icons-react';
import type { DrawMilestone } from '@/types';

interface ProjectInfo {
  id: string;
  address: string;
  city: string;
  state: string;
}

const MILESTONE_LABELS: Record<DrawMilestone, string> = {
  project_start: 'Project Start',
  demo_complete: 'Demo Complete',
  rough_in: 'Rough-In',
  drywall: 'Drywall',
  finishes: 'Finishes',
  final: 'Final',
};

export default function VendorDrawRequestPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [milestone, setMilestone] = useState<DrawMilestone | ''>('');
  const [amount, setAmount] = useState('');
  const [percentComplete, setPercentComplete] = useState('');
  const [description, setDescription] = useState('');

  // Load project info
  useEffect(() => {
    async function loadProject() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('projects')
          .select('id, address, city, state')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Project not found or link is invalid.');
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorName.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();

      // Get the next draw number
      const { data: draws } = await supabase
        .from('draws')
        .select('draw_number')
        .eq('project_id', projectId)
        .order('draw_number', { ascending: false })
        .limit(1);

      const nextDrawNumber = draws && draws.length > 0 ? draws[0].draw_number + 1 : 1;

      // Create the draw request
      const { error } = await supabase.from('draws').insert({
        project_id: projectId,
        draw_number: nextDrawNumber,
        milestone: milestone || null,
        description: `[Vendor: ${vendorName}${vendorEmail ? `, ${vendorEmail}` : ''}${vendorPhone ? `, ${vendorPhone}` : ''}] ${description}`.trim(),
        percent_complete: percentComplete ? Number(percentComplete) : null,
        amount: Number(amount),
        date_requested: new Date().toISOString().split('T')[0],
        status: 'pending',
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Draw request submitted successfully!');
    } catch (err) {
      console.error('Error submitting draw request:', err);
      toast.error('Failed to submit draw request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-md mx-auto p-6">
          <IconAlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-semibold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">
            {error || 'This draw request link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <IconCheck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Request Submitted</h1>
          <p className="text-muted-foreground mb-4">
            Your draw request has been submitted successfully. The project owner will review and process your request.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setVendorName('');
              setVendorEmail('');
              setVendorPhone('');
              setMilestone('');
              setAmount('');
              setPercentComplete('');
              setDescription('');
            }}
            className="text-primary hover:underline"
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <Toaster position="top-center" />

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <IconReceipt className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Submit Draw Request</h1>
          <p className="text-muted-foreground mt-1">
            {project.address}, {project.city}, {project.state}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-medium flex items-center gap-2">
              <IconBuildingStore className="h-4 w-4" />
              Vendor Information
            </h2>

            <div>
              <label className="text-sm font-medium">
                Vendor / Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Your company name"
                className="w-full mt-1 p-3 rounded-lg border text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full mt-1 p-3 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full mt-1 p-3 rounded-lg border text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-medium flex items-center gap-2">
              <IconReceipt className="h-4 w-4" />
              Draw Details
            </h2>

            <div>
              <label className="text-sm font-medium">
                Amount Requested <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 pl-7 rounded-lg border text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Milestone</label>
                <select
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value as DrawMilestone | '')}
                  className="w-full mt-1 p-3 rounded-lg border text-sm"
                >
                  <option value="">Select...</option>
                  {Object.entries(MILESTONE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">% Complete</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percentComplete}
                  onChange={(e) => setPercentComplete(e.target.value)}
                  placeholder="0"
                  className="w-full mt-1 p-3 rounded-lg border text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description of Work Completed</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work completed for this draw request..."
                rows={3}
                className="w-full mt-1 p-3 rounded-lg border text-sm resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <IconLoader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <IconCheck className="h-4 w-4" />
                Submit Draw Request
              </>
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting this request, you confirm that the work described has been completed
            and you are requesting payment as agreed.
          </p>
        </form>
      </div>
    </div>
  );
}
