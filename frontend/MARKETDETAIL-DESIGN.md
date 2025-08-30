# MarketDetail Page - New UI Layout Design

## Overview
A completely redesigned MarketDetail page with a modern, clean layout inspired by professional prediction market platforms.

## Layout Structure

### 1. Hero Section (Full Width)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Category Badge]                    [Status Badge]             │
│                                                                 │
│ [Market Image]  [Question Title - Large, Bold]                 │
│                 [Description - Medium text]                     │
│                                                                 │
│ [Progress Bar: Yes ████████░░ No] [Total Pool: $X,XXX]        │
│ [Yes: XX%] [No: XX%]              [Ends: Date Time]           │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Main Content (2-Column Grid)
```
┌─────────────────────────────────────────────────────────────────┐
│ Left Column (2/3)                    │ Right Column (1/3)      │
│                                      │                         │
│ ┌─────────────────────────────────┐  │ ┌─────────────────────┐ │
│ │ 📊 Market Statistics           │  │ │ 💰 Trading Panel    │ │
│ │ • Total Volume                 │  │ │                     │ │
│ │ • Active Participants          │  │ │ [Pick a Side]       │ │
│ │ • Market Creation Date        │  │ │ [Yes] [No]          │ │
│ │ • Last Activity               │  │ │                     │ │
│ └─────────────────────────────────┘  │ │ Amount ($)          │ │
│                                      │ │ [Input Field]       │ │
│ ┌─────────────────────────────────┐  │ │ [+/- Buttons]       │ │
│ │ 📋 Market Details              │  │ │                     │ │
│ │ • Description                  │  │ │ Balance: $X,XXX     │ │
│ │ • Source                      │  │ │ [Max]               │ │
│ │ • Rules                       │  │ │                     │ │
│ │ • Resolution Criteria         │  │ │ [Quick Stats]       │ │
│ └─────────────────────────────────┘  │ │ • Avg Price         │ │
│                                      │ │ • Shares            │ │
│ ┌─────────────────────────────────┐  │ │ • Est. Fees         │ │
│ │ 👥 Participants                │  │ │ • Potential Return  │ │
│ │ • Top Traders                  │  │ │                     │ │
│ │ • Recent Activity              │  │ │ [Buy Button]        │ │
│ │ • Participation Chart          │  │ └─────────────────────┘ │
│ └─────────────────────────────────┘  │                         │
│                                      │ ┌─────────────────────┐ │
│ ┌─────────────────────────────────┐  │ │ 📈 Market Activity │ │
│ │ 📚 Order Book                  │  │ │ • Recent Trades     │ │
│ │ • Buy Orders                   │  │ │ • Volume Chart      │ │
│ │ • Sell Orders                  │  │ │ • Price History     │ │
│ │ • Market Depth                 │  │ └─────────────────────┘ │
│ └─────────────────────────────────┘  │                         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Hero Section
- **Category Badge**: Rounded pill with background color
- **Status Badge**: Market status (Active/Resolved/Cancelled)
- **Market Image**: 120x120px with fallback avatar
- **Question Title**: Large, bold text (24px+)
- **Description**: Medium text below title
- **Progress Bar**: Visual representation of Yes/No split
- **Market Stats**: Total pool, end time, percentages

### Left Column Components

#### 1. Market Statistics Card
- Total volume traded
- Number of active participants
- Market creation timestamp
- Last activity timestamp
- Market health indicators

#### 2. Market Details Card
- **Description**: Full market description
- **Source**: Source of truth with link
- **Rules**: Market resolution rules
- **Resolution Criteria**: How the market will be resolved

#### 3. Participants Card
- Top traders by volume
- Recent participation activity
- Participation distribution chart
- User rankings

#### 4. Order Book Card
- Buy orders (green)
- Sell orders (red)
- Market depth visualization
- Price levels

### Right Column Components

#### 1. Trading Panel (Sticky)
- **Pick a Side**: Yes/No selection buttons
- **Amount Input**: Dollar amount with +/- controls
- **Balance Display**: Current wallet balance
- **Max Button**: Quick max amount selection
- **Quick Stats**: Real-time trading metrics
- **Buy Button**: Execute trade button

#### 2. Market Activity Panel
- Recent trades feed
- Volume chart
- Price history graph
- Market sentiment indicators

## Responsive Behavior

### Desktop (lg+)
- 2-column layout with 2/3 + 1/3 split
- Right column sticky positioning
- Full feature set visible

### Tablet (md)
- Single column layout
- Trading panel moves below content
- Collapsible sections

### Mobile (sm)
- Stacked layout
- Trading panel at bottom
- Simplified navigation

## Color Scheme
- **Primary**: Brand color for main actions
- **Accent**: Green for positive/Yes actions
- **Danger**: Red for negative/No actions
- **Success**: Green for successful actions
- **Warning**: Yellow for caution states
- **Info**: Blue for informational elements

## Typography
- **Headings**: Bold, large text for hierarchy
- **Body**: Regular weight for readability
- **Labels**: Medium weight for form elements
- **Captions**: Small text for metadata

## Spacing System
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)

## Interactive Elements
- **Hover States**: Subtle color changes
- **Focus States**: Clear focus indicators
- **Loading States**: Skeleton loaders
- **Error States**: Clear error messaging
- **Success States**: Confirmation feedback

## Accessibility Features
- Proper heading hierarchy
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast ratios
- Screen reader compatibility
