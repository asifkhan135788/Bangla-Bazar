# BanglaBazar Worklog

---
Task ID: 1
Agent: Main Agent
Task: Admin-customer chat with Supabase Realtime, typing animation, username/profile pic, click-to-open chat

Work Log:
- Rewrote ChatView.tsx with conversation list + chat room architecture
- Added ConversationList component showing all conversations with avatars, last message, unread counts
- Added ChatRoom component with real-time messaging, typing indicators, read receipts
- Added typing indicator animation (3 bouncing dots) using Supabase Presence broadcast
- Added user avatar display in chat header and message sender labels
- Updated Chat API route with conversations list, user_info, mark_read actions
- Added Supabase Realtime typing indicator support (subscribeToTyping, broadcastTyping)
- Messages now include sender info (name, avatar) via Prisma includes

Stage Summary:
- Chat now has a conversation list view before opening individual chats
- Typing animation shows when the other party is typing
- Usernames and profile pictures display in chat headers and messages
- Read receipts (✓/✓✓) shown on sent messages
- Mark-as-read API updates messages when user opens a conversation

---
Task ID: 2
Agent: Main Agent
Task: Profile pic upload via R2 (owner-only edit)

Work Log:
- Created /api/upload/avatar route with POST (upload) and DELETE (remove) methods
- Validates file type (JPEG, PNG, WebP, GIF) and size (max 2MB)
- Deletes old avatar from R2 before uploading new one
- Updates user.avatar in database after successful upload
- Updated ProfileView with camera icon overlay on avatar
- Added file input handler with client-side validation and progress state
- Added delete avatar button (X icon) when avatar exists

Stage Summary:
- Users can upload profile pictures via camera button on their avatar
- Old avatars are automatically cleaned up from R2 storage
- File type and size validation on both client and server
- Avatar updates persist in auth store immediately

---
Task ID: 3
Agent: Main Agent
Task: Google Auth via Supabase for sign up

Work Log:
- Created /api/auth/google-callback route for OAuth callback handling
- Exchanges authorization code for Supabase session
- Auto-creates user in our DB on first Google login (with random password)
- Updates avatar from Google profile on subsequent logins
- Creates admin session token if user is admin
- Added Google Sign Up button to RegisterForm with Google logo SVG
- Added signInWithGoogle function to supabase.ts
- Updated page.tsx to handle auth_success and auth_error URL params

Stage Summary:
- Users can sign up/log in with Google via Supabase OAuth
- New users are auto-created in the database with Google profile data
- Avatar is synced from Google profile picture
- URL params are cleaned after successful auth callback

---
Task ID: 4
Agent: Main Agent
Task: Assets folder guide

Work Log:
- Created ASSETS.md with comprehensive guide
- Created payment/ and brands/ directories under public/images/
- Documented all asset requirements (sizes, formats, optimization tips)

Stage Summary:
- ASSETS.md provides complete documentation for all image assets
- Directory structure is prepared for payment logos and brand images

---
Task ID: 5
Agent: Main Agent
Task: Order success/fail toast notification fix

Work Log:
- Replaced simple toast.success with full-screen order success animation
- Added animated checkmark icon with spring animation
- Shows order details card (Order ID, Total, Payment method)
- Added "View Orders" and "Continue Shopping" action buttons
- Error notifications still use toast.error for specific error messages

Stage Summary:
- Order success now shows a beautiful animated confirmation screen
- Displays order details and provides clear next-action buttons
- Failed orders show specific error messages via toast

---
Task ID: 6
Agent: Main Agent
Task: Agent number from admin panel (random if multiple, send to Telegram with order)

Work Log:
- Created /api/settings/agents route with GET and PUT methods
- Agents stored in settings table as JSON array [{name, phone}]
- Updated orders POST to fetch random agent from settings
- Updated Telegram alert to include agentNumber field
- Agent number is sent with every Telegram order notification

Stage Summary:
- Admin can configure multiple agent phone numbers via API
- Random agent is selected for each order
- Agent number is included in Telegram order notification

---
Task ID: 7
Agent: Main Agent
Task: Delivery address with zilla/upazila/gram/home + live location fetch

Work Log:
- Replaced textarea address with structured BD address form
- Added fields: Zilla (district), Upazila, Gram (village/area), Home/Holding
- Added live location button using navigator.geolocation.getCurrentPosition
- Location uses high-accuracy GPS (not IP-based)
- Full address is composed from parts: "Home, Gram, Upazila, Zilla [Location: lat, lng]"
- Added validation for required address fields (zilla, upazila, home)
- Location button shows loading state and captured coordinates

Stage Summary:
- Delivery address now uses structured Bangladesh format
- Live GPS location is captured and stored with the address
- All address fields are validated before order submission
- Bengali/English mixed input is supported

---
Task ID: 8
Agent: Main Agent
Task: Ban/unban fix from admin + ban duration setting + real IP and user agent logging

Work Log:
- Updated admin users PUT endpoint with ban_days and ban_reason parameters
- Added permanent_ban action (bannedUntil = null)
- All admin actions now log real IP and user agent
- Registration now logs client IP in details field
- Login already logged IP and user agent (confirmed working)
- Admin IP captured from X-Forwarded-For, X-Real-IP, CF-Connecting-IP headers

Stage Summary:
- Admin can set custom ban duration (days) and reason
- Permanent ban option (no expiry) is available
- All auth actions log real client IP and user agent
- User logs include IP addresses for security auditing

---
Task ID: 9
Agent: Main Agent
Task: New SQL separately (without deleting old ones)

Work Log:
- Created scripts/supabase-incremental.sql with additive-only SQL
- Added agent_numbers setting row
- Added new indexes for chat conversation listing and unread messages
- Added indexes for user_logs IP and user agent lookups
- Created get_admin_user_id() function
- Created get_user_conversations() function
- Created mark_messages_read() function
- Added RLS policies for chat_messages CRUD operations
- Added public read policy for payment settings
- Enabled Realtime for chat_messages table

Stage Summary:
- Incremental SQL file can be run after the original schema
- No drops, no recreates - all changes are additive
- New functions support the chat system features
- RLS policies are properly configured for security

---
Task ID: 10
Agent: Main Agent
Task: Remove menu button + replace skeleton loader with website-matching loader

Work Log:
- Removed hamburger menu button from Header component
- Removed entire side drawer (AnimatePresence, drawer panel, menu items)
- Cleaned up unused imports (motion, AnimatePresence) and state (drawerOpen)
- Logo moved to left side of header (was center with menu on left)
- Created BrandedLoader component with BanglaBazar-themed spinners
- ProductCardLoader: gold-themed card with spinning ring
- CategoryCardLoader: gold-themed category circle
- BanglaBazarLoader: dual-ring spinner with center dot
- PageLoader: full-page centered loader
- Updated FeaturedProducts to use ProductCardLoader
- Updated CategoryGrid to use CategoryCardLoader

Stage Summary:
- Menu button removed, logo repositioned to left
- Drawer menu completely removed (functionality exists in BottomNav + Profile)
- New branded loaders match the gold/dark theme
- Skeleton loaders replaced with animated spinning rings
