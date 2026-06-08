# Quest Page Refinements - Testing Guide

## Overview
This guide provides comprehensive testing procedures for the three Quest page feature refinements. Each section includes step-by-step tests, expected outcomes, and validation criteria.

---

## Feature 1: Quest Card - Reward Pool Visibility

### Unit Testing

#### Test 1.1: Reward Pool Display
**Objective:** Verify reward pool appears prominently on quest cards

**Steps:**
1. Navigate to the Quest section on home page
2. Observe the first quest card in the list
3. Look for the reward pool section

**Expected Result:**
- Gift icon visible
- "Reward Pool" label displayed
- Reward amount (e.g., "10,000 XP + W3C Tokens") shown in large, bold text
- Blue/primary color background highlight
- Section positioned below quest description

**Validation:**
- [ ] Reward pool visible at normal viewing distance
- [ ] Font size is noticeably larger than other text
- [ ] Icon and label are properly aligned
- [ ] No overflow or text truncation

#### Test 1.2: Progress Bar Removal
**Objective:** Confirm progress bar is completely removed

**Steps:**
1. Check multiple quest cards (at least 5)
2. Scroll through entire quest list
3. Look for any progress indicator bars

**Expected Result:**
- No progress bars visible on any quest cards
- No space where progress bar was allocated
- Layout appears clean without gaps

**Validation:**
- [ ] No progress indicators on any cards
- [ ] No empty space where progress bar was
- [ ] Card spacing remains consistent

#### Test 1.3: Multi-Quest Verification
**Objective:** Verify reward pool displays correctly for all quests

**Steps:**
1. Check at least 8 different quest cards
2. Verify each shows its unique reward pool value

**Expected Results:**
- Quest 1: "10,000 XP + W3C Tokens"
- Quest 2: "7,500 XP + Aurora Tokens"
- Quest 3: "5,000 XP"
- Quest 4: "12,500 XP + Security Badges"
- Quest 5: "8,000 XP + DAO Tokens"
- Quest 6: "9,000 XP + ATOM Tokens"
- Quest 7: "11,000 XP + ARB Tokens"
- Quest 8: "13,500 XP + Staking Rewards"

**Validation:**
- [ ] All rewards displayed correctly
- [ ] Each quest shows correct pool value

### Integration Testing

#### Test 1.4: Responsive Design
**Objective:** Verify reward pool displays correctly on all screen sizes

**Device Tests:**
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1024px+ width)

**Expected Result:**
- Reward pool section visible on all screen sizes
- Text remains readable and bold
- Icon scales appropriately
- No overflow or wrapping issues

#### Test 1.5: Dark/Light Mode
**Objective:** Verify reward pool styling works in all color schemes

**Steps:**
1. Switch between light and dark mode
2. Check reward pool appearance on both

**Expected Result:**
- Reward pool clearly visible in both modes
- Primary color contrast adequate in both modes
- Text readable without strain
- Icon visible and clear

### Edge Cases

#### Test 1.6: Long Reward Text
**Objective:** Verify layout handles longer reward descriptions

**Test Data:**
- "15,500 XP + Multiple Token Rewards + Exclusive Badge"

**Expected Result:**
- Text may wrap if necessary
- No overflow beyond container
- Remains readable

---

## Feature 2: Quest Detail - Proof of Completion Logic

### Unit Testing - Social Tasks

#### Test 2.1: Social Task Screenshot Upload
**Objective:** Verify screenshot upload for social tasks

**Steps:**
1. Navigate to a quest detail page
2. Find a Social task (e.g., "Follow @StellarDev on Twitter")
3. Click on the task to open modal

**Expected Result:**
- Modal opens showing task details
- "Submit Proof (Screenshot)" heading visible
- Upload button with "Click to upload screenshot" text
- File type hint: "PNG, JPG, GIF up to 10MB"

**Validation:**
- [ ] Modal opens correctly
- [ ] Screenshot section displays
- [ ] Upload button is clickable
- [ ] Placeholder text guides user

#### Test 2.2: Screenshot File Selection
**Objective:** Verify file selection works correctly

**Steps:**
1. Click upload button
2. Select a PNG/JPG image file
3. Observe modal response

**Expected Result:**
- File picker opens
- Selected file name displays where placeholder was
- "Claim Reward" button becomes enabled
- File size validation (reject >10MB)

**Validation:**
- [ ] File picker dialog opens
- [ ] Selected file name displays
- [ ] Button state changes to enabled
- [ ] Large files rejected with feedback

#### Test 2.3: Social Task XP Display
**Objective:** Verify XP reward display for social task

**Expected Result:**
- XP reward shown (e.g., "+50 XP")
- Displayed in blue/primary color
- Text is bold and prominent
- Positioned in dedicated reward box

**Validation:**
- [ ] XP amount visible
- [ ] Color is primary/blue
- [ ] Proper formatting applied

### Unit Testing - On-Chain Tasks

#### Test 2.4: On-Chain Task Transaction Hash Input
**Objective:** Verify transaction hash input for on-chain tasks

**Steps:**
1. Navigate to quest detail page
2. Find an On-Chain task
3. Click on task to open modal

**Expected Result:**
- Modal shows "Transaction Hash" section
- Input field with placeholder: "0x... (64 character hex)"
- Helper text explains requirement
- Font is monospace for hash input

**Validation:**
- [ ] Input field displays correctly
- [ ] Placeholder text present
- [ ] Monospace font applied
- [ ] Helper text clear

#### Test 2.5: Transaction Hash Validation
**Objective:** Verify real-time validation of transaction hash

**Steps:**
1. Leave input empty → observe button state
2. Enter incomplete hash "0x123" → observe validation
3. Enter invalid format "abc123xyz" → observe validation
4. Enter valid hash "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" → observe validation

**Expected Result:**
- Empty: "Claim Reward" button disabled
- Incomplete (0x123): Button disabled, error message appears
- Invalid (abc123xyz): Button disabled, error message appears
- Valid: Button becomes enabled, no error message

**Error Message:**
- "Invalid transaction hash format" shown for invalid input
- Message appears in red alert box with icon

**Validation:**
- [ ] Real-time validation working
- [ ] Button state changes appropriately
- [ ] Error message clear and helpful
- [ ] No false positives

### Unit Testing - Off-Chain Tasks

#### Test 2.6: Off-Chain Task Screenshot Upload
**Objective:** Verify screenshot upload for off-chain tasks

**Steps:**
1. Find an Off-Chain task in quest detail
2. Click to open modal

**Expected Result:**
- Similar to social task screenshot upload
- Text says "Submit Proof (Screenshot)"
- Helper text: "Upload a screenshot showing completion of this task"

**Validation:**
- [ ] Upload UI appears correctly
- [ ] Instructions clear
- [ ] File selection works
- [ ] Button enabled after file select

### Unit Testing - Referral Tasks

#### Test 2.7: Referral Task Info Input
**Objective:** Verify referral information input

**Steps:**
1. Find a Referral task (if available)
2. Click to open modal

**Expected Result:**
- Text input field appears
- Placeholder: "Enter referral details..."
- Helper text explains requirement
- "Claim Reward" button disabled until input

**Validation:**
- [ ] Input field displays
- [ ] Placeholder text clear
- [ ] Button state management works

### Integration Testing

#### Test 2.8: Modal Close Behavior
**Objective:** Verify modal closes and preserves/resets state

**Steps:**
1. Open task modal
2. Enter some proof
3. Click Cancel
4. Reopen task modal

**Expected Result:**
- Modal closes on Cancel
- Previously entered proof is cleared
- No data persists between modal openings
- Modal opens fresh

**Validation:**
- [ ] Modal closes properly
- [ ] State resets correctly
- [ ] No data leakage between sessions

#### Test 2.9: Multiple Tasks in Sequence
**Objective:** Verify switching between different task types

**Steps:**
1. Open Social task → Submit proof → Close
2. Open On-Chain task → Enter hash → Close
3. Open Referral task → Enter info → Close

**Expected Result:**
- Each task shows correct proof type
- No UI elements bleed between task types
- State properly isolated per task

**Validation:**
- [ ] Task types clearly separated
- [ ] No UI confusion between types
- [ ] State isolation working

### Edge Cases

#### Test 2.10: Large Files
**Objective:** Verify handling of oversized image uploads

**Steps:**
1. Try uploading file >10MB

**Expected Result:**
- File rejected with clear message
- Button remains disabled
- Can select different file

#### Test 2.11: Invalid File Types
**Objective:** Verify rejection of non-image files

**Steps:**
1. Try uploading PDF, TXT, or video file

**Expected Result:**
- File picker filtered to images only (if browser supports)
- Or file rejected with error message
- Button remains disabled

#### Test 2.12: Special Characters in Hash
**Objective:** Verify validation rejects mixed case edge cases

**Steps:**
1. Enter hash with lowercase: `0xabcdef...` (valid)
2. Enter hash with uppercase: `0xABCDEF...` (valid)
3. Enter hash with mixed: `0xAbCdEf...` (valid)

**Expected Result:**
- All three valid formats accepted
- Regex handles case-insensitivity
- Button enabled for all valid formats

---

## Feature 3: Quest Creator - Duration Selection

### Unit Testing

#### Test 3.1: Duration Selector Display
**Objective:** Verify duration selector UI displays correctly

**Steps:**
1. Open Create Quest from quest menu
2. Navigate to Details tab
3. Look for Quest Duration section

**Expected Result:**
- "Quest Duration" label visible
- Three buttons: "14 days", "30 days", "60 days"
- Buttons arranged in equal grid (3 columns)
- Helper text: "Select how long the quest will be active"
- Duration section appears BEFORE Total Reward Pool

**Validation:**
- [ ] All three duration options present
- [ ] Positioned before reward pool
- [ ] Buttons visible and clickable
- [ ] Grid layout looks balanced

#### Test 3.2: Duration Selection
**Objective:** Verify duration selection works correctly

**Steps:**
1. Click "14 days" button
2. Observe visual feedback
3. Click "30 days" button
4. Observe visual feedback
5. Click "60 days" button
6. Observe visual feedback

**Expected Result:**
- Selected button shows:
  - Primary color border (thicker/darker)
  - Primary color background (light fill)
  - Primary color text
  - Smooth transition animation
- Unselected buttons show:
  - Neutral border
  - Neutral background
  - Normal text color
  - Hover effect on mouseover

**Validation:**
- [ ] Only one button selected at a time
- [ ] Visual feedback clear and immediate
- [ ] Transitions smooth
- [ ] Hover states work

#### Test 3.3: Default Selection
**Objective:** Verify default duration value

**Steps:**
1. Open Create Quest dialog
2. Check which duration is pre-selected
3. Close without changing
4. Reopen dialog
5. Verify same default selected

**Expected Result:**
- "14 days" is pre-selected/highlighted
- Default is consistent across sessions

**Validation:**
- [ ] 14 days selected by default
- [ ] Default persists correctly

### Integration Testing

#### Test 3.4: Duration Persistence in Draft
**Objective:** Verify duration value saves to draft

**Steps:**
1. Open Create Quest
2. Select "30 days"
3. Fill in other quest details
4. Navigate to another tab (Preview/Tasks)
5. Return to Details tab
6. Check if 30 days still selected

**Expected Result:**
- Selected duration persists
- Value is saved in draft
- Returns to correct selection

**Validation:**
- [ ] Selection persists within session
- [ ] Auto-save includes duration
- [ ] Draft loading restores duration

#### Test 3.5: Duration in Publish Confirmation
**Objective:** Verify duration appears in publish confirmation

**Steps:**
1. Fill out complete quest form
2. Select "60 days" duration
3. Click Publish button
4. Check confirmation dialog

**Expected Result:**
- Confirmation dialog shows quest details
- Duration should be reflected (for countdown calculations)
- User sees "60 days" associated with quest

**Validation:**
- [ ] Duration visible in confirmation
- [ ] Value is correct

### Edge Cases

#### Test 3.6: No Duration Selected (Force Selection)
**Objective:** Verify user cannot proceed without selecting duration

**Expected Behavior:**
- All three durations clearly clickable
- At least one (default) always selected
- Publish should not allow null/undefined duration

**Validation:**
- [ ] Duration always has a value
- [ ] Cannot create quest without duration

#### Test 3.7: Duration Change Mid-Creation
**Objective:** Verify changing duration mid-creation works smoothly

**Steps:**
1. Create quest with 14 days selected
2. Fill several fields
3. Change to 30 days
4. Continue filling fields
5. Change to 60 days
6. Complete and publish

**Expected Result:**
- Duration changes smoothly
- No data loss when changing duration
- Final duration is 60 days

**Validation:**
- [ ] Changes work without errors
- [ ] No data corruption
- [ ] Final value is correct

---

## Cross-Browser & Device Testing

### Browsers to Test
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest version)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Devices to Test
- [ ] iPhone 12/13/14
- [ ] iPhone SE (small)
- [ ] iPad (tablet)
- [ ] Galaxy S21 (Android)
- [ ] Desktop 1920x1080
- [ ] Desktop 2560x1440 (ultrawide)
- [ ] Tablet 768px
- [ ] Mobile 375px

### Test Checklist Per Browser/Device

#### Quest Card Reward Pool
- [ ] Text readable
- [ ] Icon visible
- [ ] Colors correct
- [ ] No truncation
- [ ] Spacing consistent

#### Proof Submission Modal
- [ ] Modal opens/closes
- [ ] File picker works (on mobile)
- [ ] Text inputs functional
- [ ] Buttons clickable
- [ ] Validation works
- [ ] Error messages visible

#### Duration Selector
- [ ] Buttons clickable
- [ ] Selection visible
- [ ] No button overlap
- [ ] Grid layout holds
- [ ] Text readable

---

## Performance Testing

### Loading Performance
- [ ] Quest list loads without lag
- [ ] Quest card reward pool renders instantly
- [ ] Modal opens within <200ms
- [ ] File upload doesn't freeze UI
- [ ] Duration selection instant feedback

### File Upload Performance
- [ ] Selecting 10MB image completes <2sec
- [ ] Validation doesn't lag
- [ ] Multiple file selections don't accumulate delays

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all elements in quest card
- [ ] Can select reward pool (if interactive)
- [ ] Can open modal with keyboard
- [ ] Can navigate proof inputs with Tab
- [ ] Can interact with duration buttons with keyboard
- [ ] Can submit with Enter key

### Screen Reader Testing
- [ ] Reward pool properly labeled
- [ ] Task type labels announced correctly
- [ ] Input fields have associated labels
- [ ] Buttons have descriptive labels
- [ ] Error messages are announced
- [ ] Duration options are clear via screen reader

### Color Contrast
- [ ] Primary color text on background meets AA standard
- [ ] Error message red has adequate contrast
- [ ] Placeholder text visible
- [ ] Button states distinguishable

---

## Summary Checklist

### Feature 1: Reward Pool
- [ ] All quest cards show reward pool
- [ ] Progress bars completely removed
- [ ] Reward text is prominent and bold
- [ ] Works across all devices and browsers
- [ ] Accessibility standards met

### Feature 2: Proof Submission
- [ ] Social tasks have screenshot upload
- [ ] Off-Chain tasks have screenshot upload
- [ ] On-Chain tasks have transaction hash input
- [ ] Referral tasks have info input
- [ ] Validation prevents invalid submissions
- [ ] XP claim locked until proof valid
- [ ] Works across all devices and browsers

### Feature 3: Duration Selection
- [ ] Duration selector visible in Details tab
- [ ] Only 14/30/60 days available
- [ ] One duration always selected
- [ ] Selection persists in draft
- [ ] Visual feedback clear
- [ ] Works across all devices and browsers

---

## Known Limitations & Future Enhancements

1. **Duration Impact**: Duration is set but not yet integrated with countdown timers. This will be done in countdown timer implementation.

2. **File Upload Preview**: Current implementation doesn't show image preview. Can be added in future iteration.

3. **Transaction Hash Help**: Could add link to block explorer for users to verify hash.

4. **Proof History**: Could implement proof history/retry mechanism for failed submissions.
