# Plan: Deal Summary Tab - Three-Column Budget Comparison

## Objective
Update the Deal Summary tab to display the three-column budget model (Underwriting vs Forecast vs Actual) with proper MAO calculation using the underwriting budget.

---

## Current State

### Props Passed to DealSummaryTab
```typescript
interface DealSummaryTabProps {
  project: Project;
  totalBudget: number;      // Uses forecast if available, else underwriting
  totalActual: number;      // Sum of actual_amount
}
```

### Current Calculations
- Single "Rehab Budget" display
- MAO = `ARV * 0.7 - totalBudget` (uses primary budget, not underwriting)
- No variance tracking between budget phases

---

## Proposed Changes

### 1. Update Props Interface

**File:** `src/components/project/project-tabs.tsx`

Pass all three budget totals plus contingency:

```typescript
<DealSummaryTab
  project={project}
  underwritingTotal={totalUnderwriting}
  forecastTotal={totalForecast}
  actualTotal={totalActual}
  contingencyPercent={project.contingency_percent}
/>
```

**File:** `src/components/project/tabs/deal-summary-tab.tsx`

```typescript
interface DealSummaryTabProps {
  project: Project;
  underwritingTotal: number;
  forecastTotal: number;
  actualTotal: number;
  contingencyPercent: number;
}
```

---

### 2. New Rehab Budget Section (Three-Column)

Replace the current single "Rehab" column with a dedicated three-column comparison card:

```
┌─────────────────────────────────────────────────────────────────┐
│ Rehab Budget Comparison                                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ UNDERWRITING    │ FORECAST        │ ACTUAL                      │
│ Pre-deal        │ Post-bid        │ Real spend                  │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ $45,000         │ $48,500         │ $47,200                     │
│                 │ +$3,500 vs UW   │ -$1,300 vs Forecast         │
│                 │ (+7.8%)         │ (-2.7%)                     │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ + Contingency   │ + Contingency   │                             │
│ $4,500 (10%)    │ $4,850 (10%)    │                             │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ TOTAL           │ TOTAL           │ TOTAL VARIANCE              │
│ $49,500         │ $53,350         │ +$2,200 vs UW               │
│                 │                 │ (+4.9%)                     │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

### 3. Updated Deal Analysis Calculations

Show three scenarios side-by-side for key metrics:

#### Total Investment (3 scenarios)
```
                    Underwriting    Forecast      Actual
Purchase Price      $150,000        $150,000      $150,000
Closing Costs       $5,000          $5,000        $5,000
Rehab + Contingency $49,500         $53,350       $47,200
Holding Costs       $8,000          $8,000        $8,000
Selling Costs       $16,000         $16,000       $16,000
────────────────────────────────────────────────────────
Total Investment    $228,500        $232,350      $226,200
```

#### Profit & ROI (3 scenarios)
```
                    Underwriting    Forecast      Actual
Gross Profit        $21,500         $17,650       $23,800
ROI                 9.4%            7.6%          10.5%
```

---

### 4. MAO Calculation Using Underwriting

**Current (incorrect):**
```typescript
const mao = arv * 0.7 - totalBudget;  // Uses primary budget
```

**Proposed (correct):**
```typescript
// MAO should use underwriting budget (pre-deal estimate)
const underwritingWithContingency = underwritingTotal * (1 + contingencyPercent / 100);
const mao = arv * 0.7 - underwritingWithContingency;
```

Display:
```
MAO (70% Rule)
$140,000 - $49,500 = $90,500

Based on underwriting budget of $49,500 (incl. contingency)
```

---

### 5. Quick Stats Bar Update

Update the bottom stats bar to show comparative data:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Gross Profit │ ROI          │ Budget Phase │ MAO          │
│ $23,800      │ 10.5%        │ Actual       │ $90,500      │
│ (Actual)     │ (Actual)     │ vs UW: +4.9% │ (Based on UW)│
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## Implementation Steps

### Step 1: Update project-tabs.tsx
- [ ] Pass `underwritingTotal`, `forecastTotal`, `actualTotal` as separate props
- [ ] Pass `contingencyPercent` to DealSummaryTab
- [ ] Remove `totalBudget` prop (will be calculated in the tab)

### Step 2: Update deal-summary-tab.tsx Interface
- [ ] Update `DealSummaryTabProps` interface with new props
- [ ] Add helper functions for contingency calculations
- [ ] Add variance calculation helpers

### Step 3: Add Three-Column Rehab Budget Card
- [ ] Create new "Rehab Budget Comparison" section
- [ ] Display underwriting, forecast, actual columns
- [ ] Show variances between phases
- [ ] Include contingency breakdown

### Step 4: Update Deal Analysis Section
- [ ] Calculate total investment for each scenario
- [ ] Calculate profit/ROI for each scenario
- [ ] Display in a comparison table format

### Step 5: Fix MAO Calculation
- [ ] Use underwriting budget for MAO calculation
- [ ] Add tooltip/note explaining MAO uses underwriting

### Step 6: Update Quick Stats Bar
- [ ] Show actual-based profit/ROI (or forecast if no actual)
- [ ] Add variance indicator vs underwriting
- [ ] Keep MAO based on underwriting

### Step 7: Testing
- [ ] Verify calculations match budget-detail-tab totals
- [ ] Test with various data scenarios (no forecast, no actual, etc.)
- [ ] Build and lint check

---

## UI Component Structure

```tsx
<DealSummaryTab>
  {/* Row 1: Property Info + Timeline (unchanged) */}
  <div className="grid grid-cols-2">
    <PropertyInfoCard />
    <TimelineCard />
  </div>

  {/* Row 2: NEW - Rehab Budget Comparison */}
  <RehabBudgetComparisonCard
    underwriting={underwritingTotal}
    forecast={forecastTotal}
    actual={actualTotal}
    contingencyPercent={contingencyPercent}
  />

  {/* Row 3: Deal Analysis (updated with 3 scenarios) */}
  <DealAnalysisCard
    scenarios={{ underwriting, forecast, actual }}
    arv={arv}
    purchasePrice={purchasePrice}
    ...
  />

  {/* Row 4: Quick Stats (updated) */}
  <QuickStatsBar ... />

  {/* Row 5: Notes (unchanged) */}
  <NotesCard />
</DealSummaryTab>
```

---

## Edge Cases to Handle

1. **No forecast data**: Show underwriting as primary budget
2. **No actual data**: Show forecast (or underwriting) as projected
3. **Negative variances**: Color code (green = under budget, red = over)
4. **Zero underwriting**: Disable MAO calculation or show warning
5. **Project status**: Show relevant budget phase based on status
   - `lead`/`analyzing`: Underwriting focus
   - `under_contract`/`in_rehab`: Forecast focus
   - `listed`/`sold`: Actual focus

---

## Estimated Complexity

- **Lines of code change**: ~150-200 lines
- **Files affected**: 2 files
  - `src/components/project/project-tabs.tsx` (minor)
  - `src/components/project/tabs/deal-summary-tab.tsx` (major rewrite of financial section)
- **New components**: None (inline changes)
- **Database changes**: None (uses existing data)
