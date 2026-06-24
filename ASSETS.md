# BanglaBazar Assets Guide

This document describes all image assets used in BanglaBazar and how to replace them.

## Directory Structure

```
public/
├── logo.svg                          # Site logo (shown in header & footer)
├── robots.txt                        # SEO robots file
└── images/
    ├── banners/
    │   └── hero-banner.svg           # Hero section banner (1200×400 recommended)
    ├── payment/
    │   ├── bkash-logo.svg            # bKash payment logo (80×30 recommended)
    │   ├── nagad-logo.svg            # Nagad payment logo (80×30 recommended)
    │   └── cod-logo.svg              # Cash on Delivery icon (80×30 recommended)
    ├── brands/
    │   └── (brand logos)             # Optional brand logos for swiper
    ├── products/
    │   └── product-placeholder.svg   # Default product image
    ├── empty-cart.svg                # Empty cart illustration
    └── empty-search.svg              # Empty search illustration
```

## Asset Requirements

### Site Logo (`logo.svg`)
- **Size**: 32×32 to 200×50px (scalable SVG preferred)
- **Format**: SVG (preferred) or PNG with transparency
- **Usage**: Header, footer, browser tab icon
- **Note**: The "BB" text fallback is shown when no logo is available

### Hero Banner (`hero-banner.svg`)
- **Size**: 1200×400px minimum (responsive, so wider is better)
- **Format**: SVG or WebP for performance, JPG acceptable
- **Usage**: Top of home page hero section
- **Note**: Text overlay is handled by the component, so the image can be decorative

### Swiper Images
- **Size**: 800×400px recommended (2:1 aspect ratio)
- **Format**: WebP or optimized JPG
- **Usage**: Product collection carousel on home page
- **Storage**: Can be local in `public/images/banners/` or via R2 CDN URLs in admin settings

### Payment Logos (`payment/bkash-logo.svg`, `payment/nagad-logo.svg`)
- **Size**: 80×30px (compact inline logos)
- **Format**: SVG preferred
- **Usage**: Checkout page payment method selection
- **Note**: Currently using inline SVG icons. Replace with actual logos for production.

### Product Placeholder (`products/product-placeholder.svg`)
- **Size**: 400×400px (1:1 square)
- **Format**: SVG
- **Usage**: Fallback when a product has no images uploaded

## How to Replace Assets

1. **Local assets**: Replace files in the `public/images/` directory directly
2. **Product images**: Upload via admin panel (stored in R2)
3. **Banner settings**: Configure banner images via admin settings panel (stored in Settings table)
4. **Payment logos**: Add SVG files to `public/images/payment/` and reference in checkout component

## Recommended Image Optimization

- Use **WebP** format for all raster images (30-50% smaller than JPEG)
- Use **SVG** for logos and icons (scalable, tiny file size)
- Compress all images before uploading (use TinyPNG, Squoosh, or similar)
- Target **under 100KB** per image for fast mobile loading
- Hero banners should be **under 200KB**
