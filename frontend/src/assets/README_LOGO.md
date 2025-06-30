# Senbird Tea Logo Setup

## Important: Logo Image Required

To complete the logo setup, you need to:

1. Save the Senbird Tea logo image you provided as:
   `/Users/sushiramen/tea-inventory-clean/frontend/public/senbird-logo.png`

2. Update the logo component to use the PNG file by changing:
   - In `/Users/sushiramen/tea-inventory-clean/frontend/src/assets/SenbirdLogo.tsx`
   - Change `src="/senbird-logo.svg"` to `src="/senbird-logo.png"`
   - Do this in both places (line 22 and line 46)

The logo is now integrated into:
- Login page (with text)
- Dashboard navigation sidebar (icon only)

The sizing is responsive and will scale appropriately based on the container.