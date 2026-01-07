'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import type { ProjectStatus, PropertyType } from '@/types';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: 'MN',
    zip: '',
    beds: '',
    baths: '',
    sqft: '',
    year_built: '',
    property_type: 'sfh' as PropertyType,
    arv: '',
    purchase_price: '',
    closing_costs: '3000',
    holding_costs_monthly: '1500',
    hold_months: '4',
    selling_cost_percent: '8.00',
    contingency_percent: '10.00',
    status: 'lead' as ProjectStatus,
  });

  // Google Places Autocomplete
  usePlacesAutocomplete({
    inputRef: addressInputRef,
    onPlaceSelected: (place) => {
      setFormData((prev) => ({
        ...prev,
        address: place.address,
        city: place.city,
        state: place.state,
        zip: place.zip,
      }));
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Format currency input (remove non-numeric except decimal)
  const handleCurrencyChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
  };

  // Format currency for display
  const formatCurrencyDisplay = (value: string) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (Number.isNaN(numValue)) return value;
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that address is provided
    if (!formData.address?.trim()) {
      toast.error('Please enter a street address');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();

      // Create project (use address as name)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.address.trim(),
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || 'MN',
          zip: formData.zip || null,
          beds: formData.beds ? parseFloat(formData.beds) : null,
          baths: formData.baths ? parseFloat(formData.baths) : null,
          sqft: formData.sqft ? parseInt(formData.sqft, 10) : null,
          year_built: formData.year_built ? parseInt(formData.year_built, 10) : null,
          property_type: formData.property_type,
          arv: formData.arv ? parseFloat(formData.arv) : null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          closing_costs: parseFloat(formData.closing_costs),
          holding_costs_monthly: parseFloat(formData.holding_costs_monthly),
          hold_months: parseFloat(formData.hold_months),
          selling_cost_percent: parseFloat(formData.selling_cost_percent),
          contingency_percent: parseFloat(formData.contingency_percent),
          status: formData.status,
          user_id: user?.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Seed budget categories from templates
      const { data: templates, error: templatesError } = await supabase
        .from('budget_category_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (templatesError) throw templatesError;

      // Create budget items from templates
      const budgetItemsToInsert: Array<{
        project_id: string;
        category: string;
        item: string;
        qty: number;
        unit: string;
        rate: number;
        underwriting_amount: number;
        forecast_amount: number;
        actual_amount: null;
        status: string;
        cost_type: string;
        priority: string;
        sort_order: number;
      }> = [];

      for (const template of templates || []) {
        const lineItems = template.default_line_items as string[] | null;

        if (lineItems && lineItems.length > 0) {
          lineItems.forEach((itemName, index) => {
            budgetItemsToInsert.push({
              project_id: project.id,
              category: template.category,
              item: itemName,
              qty: 1,
              unit: 'ea' as const,
              rate: 0,
              underwriting_amount: 0,
              forecast_amount: 0,
              actual_amount: null,
              status: 'not_started' as const,
              cost_type: 'both' as const,
              priority: 'medium' as const,
              sort_order: (template.sort_order * 1000) + index,
            });
          });
        }
      }

      if (budgetItemsToInsert.length > 0) {
        const { error: budgetItemsError } = await supabase
          .from('budget_items')
          .insert(budgetItemsToInsert);

        if (budgetItemsError) {
          console.error('Error seeding budget items:', budgetItemsError);
          // Don't throw - project was created successfully, just log the error
        }
      }

      toast.success('Project created successfully!');
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <IconArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">New Project</h1>
              <p className="text-sm text-muted-foreground">Create a new fix & flip project</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>Basic details about the property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    ref={addressInputRef}
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Start typing an address..."
                    required
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Start typing and select from the dropdown. City, state, and ZIP will be automatically filled.
                  </p>
                  {/* Display auto-filled location info */}
                  {(formData.city || formData.state || formData.zip) && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span className="text-green-600">✓</span>
                      {formData.city && <span>{formData.city}</span>}
                      {formData.state && <span>, {formData.state}</span>}
                      {formData.zip && <span> {formData.zip}</span>}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(v) => handleChange('property_type', v)}>
                    <SelectTrigger id="property_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sfh">Single Family Home</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                      <SelectItem value="triplex">Triplex</SelectItem>
                      <SelectItem value="fourplex">Fourplex</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="beds">Beds</Label>
                    <Input
                      id="beds"
                      type="number"
                      step="0.5"
                      value={formData.beds}
                      onChange={(e) => handleChange('beds', e.target.value)}
                      placeholder="3"
                      className="tabular-nums"
                    />
                  </div>
                  <div>
                    <Label htmlFor="baths">Baths</Label>
                    <Input
                      id="baths"
                      type="number"
                      step="0.5"
                      value={formData.baths}
                      onChange={(e) => handleChange('baths', e.target.value)}
                      placeholder="2"
                      className="tabular-nums"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sqft">Sqft</Label>
                    <Input
                      id="sqft"
                      type="number"
                      value={formData.sqft}
                      onChange={(e) => handleChange('sqft', e.target.value)}
                      placeholder="1500"
                      className="tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="year_built">Year Built</Label>
                  <Input
                    id="year_built"
                    type="number"
                    value={formData.year_built}
                    onChange={(e) => handleChange('year_built', e.target.value)}
                    placeholder="1950"
                    className="tabular-nums"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Project Status</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="analyzing">Analyzing</SelectItem>
                      <SelectItem value="under_contract">Under Contract</SelectItem>
                      <SelectItem value="in_rehab">In Rehab</SelectItem>
                      <SelectItem value="listed">Listed</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="dead">Dead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Financials</CardTitle>
              <CardDescription>Purchase price, ARV, and cost assumptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_price">Purchase Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="purchase_price"
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyDisplay(formData.purchase_price)}
                      onChange={(e) => handleCurrencyChange('purchase_price', e.target.value)}
                      placeholder="150,000"
                      className="pl-7 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="arv">After Repair Value (ARV)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="arv"
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyDisplay(formData.arv)}
                      onChange={(e) => handleCurrencyChange('arv', e.target.value)}
                      placeholder="250,000"
                      className="pl-7 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="closing_costs">Closing Costs</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="closing_costs"
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyDisplay(formData.closing_costs)}
                      onChange={(e) => handleCurrencyChange('closing_costs', e.target.value)}
                      placeholder="3,000"
                      className="pl-7 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="holding_costs_monthly">Monthly Holding Costs</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="holding_costs_monthly"
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyDisplay(formData.holding_costs_monthly)}
                      onChange={(e) => handleCurrencyChange('holding_costs_monthly', e.target.value)}
                      placeholder="1,500"
                      className="pl-7 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hold_months">Hold Period (Months)</Label>
                  <Input
                    id="hold_months"
                    type="number"
                    step="0.1"
                    value={formData.hold_months}
                    onChange={(e) => handleChange('hold_months', e.target.value)}
                    className="tabular-nums"
                  />
                </div>

                <div>
                  <Label htmlFor="selling_cost_percent">Selling Costs (%)</Label>
                  <Input
                    id="selling_cost_percent"
                    type="number"
                    step="0.01"
                    value={formData.selling_cost_percent}
                    onChange={(e) => handleChange('selling_cost_percent', e.target.value)}
                    className="tabular-nums"
                  />
                </div>

                <div>
                  <Label htmlFor="contingency_percent">Contingency (%)</Label>
                  <Input
                    id="contingency_percent"
                    type="number"
                    step="0.01"
                    value={formData.contingency_percent}
                    onChange={(e) => handleChange('contingency_percent', e.target.value)}
                    className="tabular-nums"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" asChild disabled={isSubmitting}>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <IconCheck className="h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
