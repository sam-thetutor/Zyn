# Market Detail Page - New UI Layout Design

## Overview
A completely redesigned MarketDetail page with a modern, intuitive interface that focuses on user experience and information hierarchy.

## Layout Structure

### 1. Hero Section (Full Width)
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 Back to Markets  |  📊 Market #123  |  🔗 Share Market    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 Will Bitcoin reach $100k by end of 2024?                  │
│                                                                 │
│  [ACTIVE] • Ends in 3d 14h 22m • Category: Cryptocurrency     │
│                                                                 │
│  📈 67.3% Yes • 32.7% No • Total Volume: 1,247.5 CELO        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Main Content Grid (3-Column Layout)
```
┌─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │
│   Left Panel    │  Center Panel   │  Right Panel    │
│   (Details)     │   (Trading)     │   (Actions)     │
│                 │                 │                 │
│                 │                 │                 │
│                 │                 │                 │
│                 │                 │                 │
│                 │                 │                 │
│                 │                 │                 │
│                 │                 │                 │
│                 │                 │                 │
│                 │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

### 3. Left Panel - Market Information
```
┌─────────────────────────────────────────────────┐
│ 📋 Market Details                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🖼️  Market Image (or placeholder)              │
│                                                 │
│ 📝 Description:                                │
│    Detailed market description text...          │
│                                                 │
│ 🔗 Source:                                     │
│    Official source or reference                 │
│                                                 │
│ 📊 Market Statistics:                          │
│    • Creation Fee: 0.1 CELO                    │
│    • Trading Fee: 0.05 CELO                    │
│    • Creator: 0x1234...abcd                    │
│    • Created: Dec 15, 2024                     │
│                                                 │
│ 📋 Rules & Resolution:                         │
│    Market will be resolved based on...          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. Center Panel - Trading Interface
```
┌─────────────────────────────────────────────────┐
│ 💰 Trade Shares                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🎯 Select Position:                            │
│ ┌─────────────┬─────────────┐                   │
│ │    YES     │     NO      │                   │
│ │  67.3%     │   32.7%     │                   │
│ │  🟢        │   🔴         │                   │
│ └─────────────┴─────────────┘                   │
│                                                 │
│ 💵 Amount to Trade:                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ 0.00 CELO                                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 📊 Quick Amounts:                              │
│ [0.1] [0.5] [1.0] [5.0] [10.0] [25%] [50%]   │
│                                                 │
│ 💸 Fee Breakdown:                              │
│ • Trading Fee: 0.05 CELO                       │
│ • Total Cost: 0.00 CELO                        │
│                                                 │
│ 🚀 [PLACE TRADE] Button                       │
│                                                 │
│ ⚠️  Trading disabled if already participated   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5. Right Panel - User Actions & Info
```
┌─────────────────────────────────────────────────┐
│ 👤 Your Position                               │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🎯 Current Shares:                             │
│ • Yes: 0 shares                               │
│ • No: 0 shares                                │
│                                                 │
│ 💰 Potential Payout:                           │
│ • If Yes wins: 0.00 CELO                      │
│ • If No wins: 0.00 CELO                       │
│                                                 │
│ 📈 Your Participation:                         │
│ • Status: Not Participated                     │
│ • Side: None                                   │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🎲 Quick Actions                               │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📊 View Order Book                             │
│ 👥 See Participants                            │
│ 📱 Share Market                                │
│ 🔔 Set Alerts                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6. Bottom Section - Additional Information
```
┌─────────────────────────────────────────────────┐
│ 📊 Market Activity                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🕒 Recent Trades                               │
│ • User 0x1234... bought 5.0 YES shares        │
│ • User 0x5678... bought 2.5 NO shares         │
│ • User 0x9abc... bought 1.0 YES shares        │
│                                                 │
│ 👥 Top Participants                            │
│ • 0x1234... - 150.0 YES shares                │
│ • 0x5678... - 75.0 NO shares                  │
│ • 0x9abc... - 50.0 YES shares                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Visual Hierarchy
- **Primary**: Market question and status
- **Secondary**: Trading interface and key stats
- **Tertiary**: Detailed information and actions

### 2. Color Coding
- **Green**: Yes shares, positive actions
- **Red**: No shares, negative actions
- **Blue**: Neutral information, links
- **Orange**: Warnings, time-sensitive info

### 3. Responsive Design
- **Desktop**: 3-column layout
- **Tablet**: 2-column layout (left + right panels)
- **Mobile**: Single column, stacked layout

### 4. Interactive Elements
- **Hover Effects**: Buttons, cards, links
- **Loading States**: Spinners, progress bars
- **Success/Error**: Toast notifications, modal confirmations

### 5. Accessibility
- **High Contrast**: Clear text and button states
- **Keyboard Navigation**: Tab order, focus indicators
- **Screen Reader**: Proper ARIA labels and descriptions

## Component Breakdown

### Core Components
1. **MarketHeader**: Title, status, back navigation
2. **MarketStats**: Key statistics and percentages
3. **TradingPanel**: Buy/sell interface
4. **UserPosition**: Current shares and potential payouts
5. **MarketInfo**: Description, source, rules
6. **ActivityFeed**: Recent trades and participants

### State Management
- Market data and user position
- Trading form state
- Loading and error states
- Transaction status

### Responsive Breakpoints
- **Desktop**: 1200px+ (3 columns)
- **Tablet**: 768px-1199px (2 columns)
- **Mobile**: <768px (1 column)

## Implementation Notes

### CSS Variables
```css
:root {
  --color-primary: #3b82f6;
  --color-accent: #10b981;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-success: #22c55e;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-accent: #f1f5f9;
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-border: #e2e8f0;
  --color-border-accent: #cbd5e1;
}
```

### Key Features
- **Real-time Updates**: Live market data and user position
- **Smart Trading**: Prevents duplicate participation
- **Fee Calculator**: Shows exact costs before trading
- **Quick Actions**: One-click common amounts
- **Social Features**: Share and bookmark markets
- **Mobile Optimized**: Touch-friendly interface

This design creates a modern, intuitive trading experience that puts the most important information first while maintaining a clean, professional appearance.
