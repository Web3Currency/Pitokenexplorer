# Quest Page - Navigation Flow & Fallback Testing Guide

## Overview
This document outlines comprehensive navigation flow testing procedures for the Quest page, including all navigation paths, fallback mechanisms, error scenarios, and edge cases.

## Navigation Architecture Overview

\`\`\`
Home Page (/)
├── Explore Tab
│   ├── Token Explorer
│   └── Pool Details
└── Quest Tab
    ├── Quest List
    │   ├── Quest Preview Cards
    │   └── Quest Creation Menu
    ├── Quest Detail (/quest/[id])
    │   ├── Quest Header (with close/leaderboard)
    │   ├── Quest Stats
    │   ├── Quest Intro
    │   ├── Task Categories
    │   │   └── Task Items
    │   │       └── Task Modal (Proof Input)
    │   └── Leaderboard Modal
    └── Quest Creation (/quest-creation)
        ├── Banner Upload
        ├── Logo Upload
        ├── Quest Details Form
        └── Preview & Submit
\`\`\`

## Primary Navigation Flows

### Flow 1: Home → Quest Detail → Leaderboard Modal → Back to Quest Detail

**Path:** `/` → `/quest/[id]` → Leaderboard Modal → `/quest/[id]`

#### Test Case 1.1: Normal Flow
\`\`\`
Action Sequence:
1. User on home page (Quest tab active)
2. Click quest preview card
3. Wait for quest detail to load
4. View quest header with trophy icon
5. Click trophy icon to open leaderboard
6. Leaderboard modal opens as overlay
7. Click X button to close leaderboard
8. Quest detail remains visible
\`\`\`

**Expected Outcome:**
- Quest detail page loads with header sticky
- Trophy icon visible and clickable
- Leaderboard modal opens without navigating away
- Modal overlay dims background appropriately
- Close button (X) properly closes modal
- Quest detail content remains intact after modal close

**Test Matrix:**

| Device | Browser | Status | Notes |
|--------|---------|--------|-------|
| Desktop | Chrome | ⬜ | |
| Desktop | Firefox | ⬜ | |
| Desktop | Safari | ⬜ | |
| Mobile | Safari | ⬜ | |
| Mobile | Chrome | ⬜ | |
| Tablet | Chrome | ⬜ | |

#### Test Case 1.2: Leaderboard Modal - Close via Outside Click (if enabled)
\`\`\`
Action Sequence:
1. Quest detail page open
2. Click trophy icon
3. Leaderboard modal opens
4. Click on dimmed background (outside modal)
5. Verify modal behavior
\`\`\`

**Expected Outcome:**
- Modal closes if outside-click is enabled
- Quest detail remains visible
- No navigation occurs

#### Test Case 1.3: Leaderboard Modal - Keyboard Navigation
\`\`\`
Action Sequence:
1. Leaderboard modal open
2. Press Tab key multiple times
3. Verify focus cycling through modal elements
4. Press Escape key
5. Verify modal closes
\`\`\`

**Expected Outcome:**
- Tab key cycles through focusable elements
- Escape key closes modal
- Focus returns to trophy button after close

---

### Flow 2: Home → Quest Detail → Task Modal → Back to Quest Detail

**Path:** `/` → `/quest/[id]` → Task Modal → `/quest/[id]`

#### Test Case 2.1: Open Task Modal - Non-Social Task
\`\`\`
Action Sequence:
1. Quest detail page open
2. Expand task category
3. Click on non-social task (e.g., On-Chain, Off-Chain)
4. Task modal opens
5. View modal content with proof input
6. Click Cancel button
7. Modal closes, quest detail visible
\`\`\`

**Expected Outcome:**
- Task modal opens with correct task information
- Proof input field visible for off-chain/referral tasks
- Cancel button closes modal cleanly
- Quest detail content preserved

#### Test Case 2.2: Open Task Modal - Social Task
\`\`\`
Action Sequence:
1. Quest detail page open
2. Click on social task with external link
3. Verify behavior (should open link, not modal OR show modal)
4. If modal: click action button
5. Verify external link opens in new tab
\`\`\`

**Expected Outcome:**
- Social tasks with links open modal
- Modal shows task details with external link button
- Link opens in new tab without closing modal
- OR task directly opens link without modal (per implementation)

#### Test Case 2.3: Task Modal - Proof Submission
\`\`\`
Action Sequence:
1. Task modal open for off-chain task
2. Enter proof text in input field
3. Click Submit button
4. Verify submission processing
5. Modal closes or shows confirmation
\`\`\`

**Expected Outcome:**
- Input accepts text correctly
- Submit button enabled when input has value
- Submission processes without errors
- Modal closes after successful submission
- Toast/confirmation message appears

#### Test Case 2.4: Task Modal - Keyboard Escape
\`\`\`
Action Sequence:
1. Task modal open
2. Press Escape key
3. Verify modal closes
4. Focus returns to task item
\`\`\`

**Expected Outcome:**
- Escape key closes modal
- Quest detail page remains visible
- No data loss

---

### Flow 3: Home → Quest Detail → Close (X Button) → Home

**Path:** `/` → `/quest/[id]` → (Click X) → `/?tab=quest`

#### Test Case 3.1: Close Button Functionality
\`\`\`
Action Sequence:
1. Quest detail page open
2. Locate close button (X) in header
3. Click close button
4. Verify navigation behavior
5. Verify home page quest tab active
\`\`\`

**Expected Outcome:**
- Close button (X) visible in top-right corner
- Clicking close navigates to home with quest tab active
- URL changes to `/?tab=quest`
- Smooth transition back to quest list
- Quest list displays without errors

#### Test Case 3.2: Close Button - Multiple Rapid Clicks
\`\`\`
Action Sequence:
1. Quest detail page open
2. Rapidly click close button multiple times
3. Verify no double navigation
4. Verify final state is correct
\`\`\`

**Expected Outcome:**
- Only one navigation occurs
- Final state is home page with quest tab
- No console errors
- No navigation artifacts

#### Test Case 3.3: Close Button - While Modal Open
\`\`\`
Action Sequence:
1. Quest detail page open
2. Open leaderboard modal
3. Click quest detail area (if clickable)
4. Try to click close button (may be obscured)
5. Close modal first
6. Then click close button
\`\`\`

**Expected Outcome:**
- Modal takes priority (outside clicks don't trigger close)
- Close modal first, then close button accessible
- Final navigation correct

---

### Flow 4: Home → Quest Creation Flow

**Path:** `/` → Quest Creation Menu → Quest Creation Dashboard → Submit/Cancel

#### Test Case 4.1: Open Creation Menu
\`\`\`
Action Sequence:
1. Home page, quest tab active
2. Locate Create Quest button/link
3. Click to open creation menu/sidebar
4. Verify menu/sidebar displays
\`\`\`

**Expected Outcome:**
- Creation menu/sidebar opens without page reload
- Form visible and ready for input
- All input fields accessible

#### Test Case 4.2: Create Quest - Banner Upload
\`\`\`
Action Sequence:
1. Creation dashboard open
2. Click banner upload area
3. Select image file from device
4. Wait for upload/preview
5. Verify preview displays
6. Verify change/remove buttons appear
7. Click remove button
8. Verify image removed
\`\`\`

**Expected Outcome:**
- File picker opens
- Image uploads and displays in preview
- Hover shows change/remove buttons
- Remove button clears image
- No obstruction of other form elements

#### Test Case 4.3: Create Quest - Logo Upload
\`\`\`
Action Sequence:
1. Creation dashboard open
2. Click logo upload area
3. Select image file
4. Wait for preview
5. Verify logo displays correctly
6. Test change/remove buttons
\`\`\`

**Expected Outcome:**
- Logo uploads and displays in correct size
- Logo doesn't break layout
- Change/remove buttons functional
- Preview shows accurate logo size

#### Test Case 4.4: Create Quest - Form Submission
\`\`\`
Action Sequence:
1. Complete all required form fields
2. Upload banner and logo
3. Add quest details (title, description, etc.)
4. Click Submit button
5. Verify submission processing
6. Verify success/error feedback
\`\`\`

**Expected Outcome:**
- Form validates all required fields
- Submission processes correctly
- Success confirmation shown
- Page navigates to quest list
- New quest visible in list

#### Test Case 4.5: Create Quest - Cancel/Close
\`\`\`
Action Sequence:
1. Creation dashboard open
2. Enter some data
3. Click close/back button or X
4. Verify cancel dialog (if applicable)
5. Confirm cancel
6. Verify return to quest list
\`\`\`

**Expected Outcome:**
- Cancel confirmation shown if data entered
- Cancel returns to quest list
- Entered data discarded safely
- No orphaned form state

---

## Navigation Fallback Scenarios

### Scenario A: Direct Deep Link Access

#### Test Case A.1: Access Quest Detail via Deep Link
\`\`\`
URL: /quest/123
Action: Direct browser navigation to URL
\`\`\`

**Expected Outcome:**
- Quest detail page loads directly
- No broken layout
- Close (X) button navigates to `/?tab=quest`
- All content loads correctly

#### Test Case A.2: Access Quest Detail - Quest Not Found
\`\`\`
URL: /quest/nonexistent-id
Action: Direct navigation
\`\`\`

**Expected Outcome:**
- Error page or 404 display (per implementation)
- Clear navigation option back to home
- No white blank page
- Error message helpful

#### Test Case A.3: Refresh Quest Detail Page
\`\`\`
URL: /quest/123
Action: Browser refresh (F5, Cmd+R)
\`\`\`

**Expected Outcome:**
- Page reloads with same content
- No session loss
- All data reloads correctly
- Close button still functional

---

### Scenario B: Browser History Fallbacks

#### Test Case B.1: Browser Back Button from Quest Detail
\`\`\`
Action Sequence:
1. Home page
2. Click quest card
3. Quest detail loads
4. Click browser back button
5. Verify navigation
\`\`\`

**Expected Outcome:**
- Returns to home page quest tab
- OR returns to previous browsing location
- No blank pages
- History state managed correctly

#### Test Case B.2: Browser Back Button - No History
\`\`\`
Action Sequence:
1. Direct navigation to /quest/123
2. Click browser back button
3. Verify behavior
\`\`\`

**Expected Outcome:**
- Navigates to home page
- OR stays on current page
- No error states
- Graceful fallback

#### Test Case B.3: Multiple Back Button Clicks
\`\`\`
Action Sequence:
1. Home → Quest 1 → Quest 2 → Quest 1 (back)
2. Back again to Home
3. Back again (beyond history)
4. Verify all states correct
\`\`\`

**Expected Outcome:**
- Each back click navigates correctly
- No unexpected skipping of pages
- Final back stabilizes at home/first page
- No navigation loops

---

### Scenario C: Tab/Window State Loss

#### Test Case C.1: App in Background, Resume to Quest Detail
\`\`\`
Action Sequence:
1. Quest detail page open
2. Switch to another app/tab
3. Wait 30 seconds
4. Return to app/tab
5. Verify page state
\`\`\`

**Expected Outcome:**
- Page state preserved
- Content still visible
- Interactions still responsive
- No unnecessary reloads

#### Test Case C.2: Browser Cache - Quest Detail Without Network
\`\`\`
Action Sequence:
1. Load quest detail page
2. Disable network
3. Refresh page
4. Verify cached content display
\`\`\`

**Expected Outcome:**
- Cached content displays
- OR clear offline message
- Close button still functional
- No broken layout

#### Test Case C.3: Session Timeout Scenario
\`\`\`
Action Sequence:
1. Quest detail page open
2. Leave for extended period (simulate timeout)
3. Interact with page (click button)
4. Verify re-authentication if needed
5. Verify page state after reauth
\`\`\`

**Expected Outcome:**
- Session timeout handled gracefully
- User redirected to login if needed
- State preserved after reauth
- Can continue using page

---

### Scenario D: URL Parameter Handling

#### Test Case D.1: Tab Parameter Routing
\`\`\`
URL: /?tab=quest
Action: Direct navigation
Expected: Quest tab active on home page

URL: /?tab=explore
Action: Direct navigation
Expected: Explore tab active on home page
\`\`\`

**Expected Outcome:**
- Tab parameter correctly sets active tab
- Invalid tab parameters fallback to default
- Tab state persists through interactions

#### Test Case D.2: From Parameter Handling
\`\`\`
URL: /quest/123?from=leaderboard
Action: Navigate to detail with from param
Expected: Close button behavior considers source
\`\`\`

**Expected Outcome:**
- from parameter recognized
- Navigation back considers the source
- Correct tab active when returning

---

## Navigation Error Scenarios

### Error Scenario 1: Network Failure During Navigation

#### Test Case: Quest Detail Load Fails
\`\`\`
Action Sequence:
1. Click quest card
2. Simulate network failure
3. Wait for error handling
4. Verify error UI
5. Test retry button
\`\`\`

**Expected Outcome:**
- Error message displayed
- Retry button functional
- Close button still accessible
- Can return to list without page reload

### Error Scenario 2: Slow Network - Loading States

#### Test Case: Slow 4G Quest Detail Load
\`\`\`
Action Sequence:
1. Set network to slow 4G
2. Click quest card
3. Observe loading states
4. Wait for full load
5. Verify all content appears
\`\`\`

**Expected Outcome:**
- Skeleton loaders visible
- Progressive content loading
- User knows page is loading
- No layout shift after load

---

## Navigation State Management

### State Test Matrix

| Scenario | Home State | Detail State | Modal State | Expected Result |
|----------|-----------|--------------|-------------|-----------------|
| Open detail | quest tab | loaded | closed | Header visible, content scrollable |
| Open modal | quest tab | visible | open | Background dimmed, modal scrollable |
| Close modal | quest tab | preserved | closed | Detail intact, focus restored |
| Close detail | quest tab | - | - | Return to home, quest tab active |
| Refresh detail | quest tab | loaded | closed | Same content, no state loss |
| Back from detail | quest tab | - | - | Return to home successfully |

---

## Navigation Performance Metrics

| Navigation Path | Target Time | Measurement Method |
|-----------------|-------------|-------------------|
| Home → Detail | < 1.5s | Time to interactive |
| Detail → Modal | < 500ms | Time from click to modal visible |
| Modal → Close | < 300ms | Time from click to modal hidden |
| Detail → Home | < 500ms | Time to page interactive |
| History back | < 800ms | Time to previous page interactive |

---

## Navigation Accessibility Checklist

| Element | Requirement | Status |
|---------|------------|--------|
| Tab order | Logical flow | ⬜ |
| Focus visible | All buttons/links | ⬜ |
| ARIA labels | All navigation buttons | ⬜ |
| Keyboard only | Navigate without mouse | ⬜ |
| Screen reader | All states announced | ⬜ |
| Skip links | Skip to main content | ⬜ |

---

## Navigation Testing Checklist

### Desktop Testing
- [ ] Chrome navigation flows complete
- [ ] Firefox navigation flows complete
- [ ] Safari navigation flows complete
- [ ] Edge navigation flows complete
- [ ] Back button works correctly
- [ ] Deep links load properly
- [ ] Tab parameters work
- [ ] Refresh maintains state

### Mobile Testing
- [ ] iPhone navigation flows
- [ ] Android navigation flows
- [ ] Back button swipe gesture
- [ ] Tab switching responsive
- [ ] Modal properly positioned
- [ ] Keyboard navigation works
- [ ] Focus visible on touch
- [ ] No navigation loops

### Tablet Testing
- [ ] Portrait navigation
- [ ] Landscape navigation
- [ ] Rotation preserves state
- [ ] Modal centered on large screen
- [ ] Tab switching responsive
- [ ] Back button functional
- [ ] No layout breaking

### Network Conditions
- [ ] Fast 4G flows work
- [ ] Slow 4G handles gracefully
- [ ] Offline content cached
- [ ] Error states display
- [ ] Retry functionality works
- [ ] No hanging states

### Error Scenarios
- [ ] Invalid quest ID handled
- [ ] Network failures handled
- [ ] Timeout scenarios handled
- [ ] Session loss handled
- [ ] Clear error messages shown
- [ ] Recovery path available

---

## Navigation Issue Template

\`\`\`markdown
## [Title]

**Navigation Path:**
Home → Detail → [Action] → [Unexpected Result]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Device/Browser:**
- Device: [Model]
- OS: [Version]
- Browser: [Name & Version]
- Network: [Connection type]

**Frequency:**
[Always / Sometimes / Rarely / Once]

**Console Errors:**
[Any JavaScript errors]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Screenshots/Video:**
[Attach if applicable]

**Workaround (if any):**
[Any temporary workaround]
\`\`\`

---

## Navigation Sign-Off

### Testing Completion
- [ ] All primary flows tested
- [ ] All fallback scenarios tested
- [ ] All error scenarios handled
- [ ] All devices/browsers tested
- [ ] Accessibility verified
- [ ] Performance metrics met
- [ ] No navigation loops
- [ ] No dead ends
- [ ] All edge cases covered

### Approvals
- **Navigation QA Lead:** ________________  **Date:** __________
- **Product Manager:** ________________  **Date:** __________
- **Technical Lead:** ________________  **Date:** __________

---

## Appendix: Navigation Map

\`\`\`
┌─ Home (/)
│  ├─ Explore Tab
│  │  └─ Token Details (navigates away from quest)
│  └─ Quest Tab (?tab=quest)
│     ├─ Quest List
│     │  ├─ Quest Card Click → /quest/[id]
│     │  └─ Create Quest Button → Creation Menu
│     └─ Creation Menu
│        └─ Submit → /quest/[id]
│
└─ Quest Detail (/quest/[id])
   ├─ Trophy Icon → Leaderboard Modal
   │  └─ Modal Close → Stay on Detail
   ├─ Task Click → Task Modal
   │  └─ Modal Close → Stay on Detail
   ├─ Close (X) → /?tab=quest
   └─ Browser Back → /?tab=quest (or previous page)

Modal Stack (Potential):
- Leaderboard Modal (from Trophy)
- Task Modal (from Task Click)
- Both can be open simultaneously? (Verify implementation)
\`\`\`
