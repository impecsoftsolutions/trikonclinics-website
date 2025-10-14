# Phase A Testing Checklist

## Pre-Testing Setup

1. **Apply Database Migration**
   ```bash
   # The migration file has been created at:
   # supabase/migrations/20251009180000_add_layout_variants.sql
   
   # This migration will:
   # - Create version snapshots of existing themes
   # - Add layoutStyle, layoutTypography, layoutSpacing to three preset themes
   # - Update theme hashes to trigger frontend refresh
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

## Testing Steps

### Test 1: Clinical Modern (Modern Layout - Ro.com Style)

**Expected Result**: Side-by-side hero with image on right

1. Login to admin panel
2. Go to "Modern Theme Settings"
3. Click "Activate" on "Clinical Modern" theme
4. Navigate to home page
5. Verify hero section shows:
   - ✅ Two-column layout (60% text, 40% image)
   - ✅ Banner image on RIGHT side
   - ✅ Bold, large headings (48px)
   - ✅ Two CTA buttons side-by-side
   - ✅ "Book Appointment" and "Emergency Call" buttons
   - ✅ Gradient background with pattern overlay
   - ✅ Generous spacing (80px section padding)
   - ✅ Tagline badge with icon at top

### Test 2: Apple Medical (Minimal Layout - Apple.com Style)

**Expected Result**: Centered clean hero with no image

1. Go back to "Modern Theme Settings"
2. Click "Activate" on "Apple Medical" theme
3. Navigate to home page
4. Verify hero section shows:
   - ✅ Single column, centered layout
   - ✅ NO side image (minimal design)
   - ✅ Light, elegant headings (36px, font-weight 300)
   - ✅ Single centered "Book Appointment" button
   - ✅ White/light gray background
   - ✅ Tight spacing (48px section padding)
   - ✅ Lots of white space
   - ✅ Uppercase tagline text
   - ✅ Thin divider line at bottom

### Test 3: Hims Health (Playful Layout - Hims.com Style)

**Expected Result**: Asymmetric playful hero with colorful design

1. Go back to "Modern Theme Settings"
2. Click "Activate" on "Hims Health" theme
3. Navigate to home page
4. Verify hero section shows:
   - ✅ Asymmetric layout (not strict grid)
   - ✅ Colorful gradient background (peachy/coral tones)
   - ✅ Decorative floating circles in background
   - ✅ Friendly, rounded headings (42px, font-weight 600)
   - ✅ Rounded pill-shaped buttons
   - ✅ Colorful badges ("Trusted Care", "Expert Team")
   - ✅ Medium spacing (64px section padding)
   - ✅ Image on right with decorative circles
   - ✅ "Book Your Visit" and "Call Now" buttons

## Typography Verification

For each theme, check heading sizes in browser DevTools:

### Clinical Modern
- Inspect H1 element
- Should show: `font-size: 48px`, `font-weight: 700`, `line-height: 1.2`
- CSS variables: `--font-size-h1: 48px`

### Apple Medical
- Inspect H1 element
- Should show: `font-size: 36px`, `font-weight: 300`, `line-height: 1.4`
- CSS variables: `--font-size-h1: 36px`

### Hims Health
- Inspect H1 element
- Should show: `font-size: 42px`, `font-weight: 600`, `line-height: 1.3`
- CSS variables: `--font-size-h1: 42px`

## Spacing Verification

Check section padding in browser DevTools:

### Clinical Modern
- Inspect hero section
- Should show: `padding-top: 80px`, `padding-bottom: 80px`
- CSS variables: `--section-padding-y: 80px`

### Apple Medical
- Should show: `padding-top: 48px`, `padding-bottom: 48px`
- CSS variables: `--section-padding-y: 48px`

### Hims Health
- Should show: `padding-top: 64px`, `padding-bottom: 64px`
- CSS variables: `--section-padding-y: 64px`

## Props Verification

Check that data from database is properly passed:

1. **Hospital Name**: Should display from hospital_profile table
2. **Banner Image**: Should display if available in hospital_profile
3. **Appointment Link**: "Book Appointment" button should link to booking URL
4. **Phone Number**: "Emergency Call" / "Call Now" button should have tel: link

## Responsive Design

Test each theme on different screen sizes:

1. **Desktop (1280px+)**: Full two-column layout
2. **Tablet (768px-1279px)**: Adjusted spacing, responsive grid
3. **Mobile (<768px)**: Stacked layout, image hidden on Modern/Playful

## Dark Mode Testing

For each theme, toggle dark mode and verify:
- Colors invert correctly
- Text remains readable
- Backgrounds adjust appropriately
- Buttons maintain contrast

## Known Issues to Check

- [ ] No console errors when switching themes
- [ ] No layout shift when theme loads
- [ ] Images load correctly
- [ ] Buttons are clickable and functional
- [ ] Animations work smoothly
- [ ] No TypeScript errors in DevTools
- [ ] Page doesn't flash on theme change

## Success Criteria

All three hero variants should:
✅ Render correctly with distinct layouts
✅ Show proper typography sizing
✅ Apply correct spacing
✅ Display hospital data from database
✅ Have functional CTA buttons
✅ Switch instantly when theme changes
✅ Be responsive on all screen sizes
✅ Support both light and dark modes

---

**If all tests pass**: Phase A implementation is complete and ready for Phase B!
**If tests fail**: Check browser console, verify migration was applied, check theme is properly activated.
