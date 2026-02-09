
# Denied.care - Medical Tourism Platform

## Overview
A bold, rebellious medical tourism app that helps people save 50-70% on dental and medical procedures by connecting them with verified providers worldwide, starting with Mexico.

---

## Design System
- **Primary Colors:** Peach (#F8B4A0), Mint Green (#5EB298), Black (#1A1A1A), Cream (#FFF5F0)
- **Vibe:** Protest energy meets premium travel app — bold typography, high contrast, unapologetic messaging
- **Typography:** Large, bold headlines with confident messaging

---

## Page 1: Landing Page

### Top Navigation Bar
- Logo "Denied" on left
- Nav links: Search, My Trips, Profile
- Login / Sign Up buttons on right (mint green accent for sign up)

### Hero Section (Black background)
- Large peach headline: "Fuck Health Insurance."
- White subheadline explaining the value proposition
- Email input + "Join the Waitlist" button (mint green)
- Stats or trust indicators below

### How It Works Section (Cream background)
Three icon cards with:
1. **Search Verified Providers** - Browse vetted clinics with reviews and certifications
2. **Book Your Procedure** - Schedule consultations and procedures online
3. **Travel With Confidence** - Concierge support, travel logistics, and aftercare

### Price Comparison Table (White/Light section)
Side-by-side comparison with 5 dental procedures:
| Procedure | U.S. Price | Mexico Price | You Save |
|-----------|------------|--------------|----------|
| Zirconia Crown | $1,500 | $350 | 77% |
| Dental Implant | $4,500 | $1,200 | 73% |
| All-on-4 | $25,000 | $8,500 | 66% |
| Root Canal | $1,800 | $350 | 81% |
| Veneers | $2,000 | $450 | 78% |

### Testimonials Section (Black background)
3 patient quote cards with placeholder testimonials, names, and procedures

### Footer
- Links: About, How It Works, For Providers, Privacy, Terms
- Social links
- Copyright © 2026 Denied.care

---

## Page 2: /search - Provider Search

### Layout
- Filter sidebar with: Location (Mexico cities), Procedure type, Price range, Rating
- Main content: Grid of provider cards showing clinic name, location, specialties, rating, starting prices
- Search bar at top

---

## Page 3: /profile - User Profile

### Layout
- Profile header with avatar, name, email
- Account settings section
- Saved providers list
- Upcoming and past trips summary

---

## Page 4: /my-trips - Trip Management

### Layout
- Tabs: Upcoming / Past trips
- Trip cards showing: Procedure name, clinic, dates, status
- Quick actions: View details, contact clinic, download documents

---

## Backend Integration (Lovable Cloud)

### Waitlist Collection
- Database table to store email signups
- Email validation
- Success confirmation toast

### Authentication
- Email/password signup and login
- Session management
- Protected routes for profile and my-trips pages

