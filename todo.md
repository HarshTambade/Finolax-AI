# AI Money Coach - Development TODO

## MVP Implementation Plan

### Core Files to Create (Max 8 files):

1. **src/App.tsx** - Main application component with routing and layout
2. **src/components/Dashboard.tsx** - Dashboard homepage with balance, jars, and alerts
3. **src/components/TransactionManager.tsx** - Add transactions and view history
4. **src/components/ChatCoach.tsx** - AI chat interface for personalized advice
5. **src/components/JarSystem.tsx** - Virtual jars component with progress tracking
6. **src/lib/analytics.ts** - Analytics engine for calculations and pattern detection
7. **src/lib/aiCoach.ts** - AI coach logic for generating personalized advice
8. **src/types/index.ts** - TypeScript types and interfaces

### Key Features:
- Dashboard with current balance and virtual jars (Rent, Bills, Savings, Emergency)
- Transaction management (manual input and CSV upload)
- AI chat coach for personalized financial advice
- Smart analytics (safe-to-spend, pattern detection, proactive warnings)
- Personalized jar allocation system

### Data Structure:
- Transactions: { id, date, amount, type (income/expense), category, description }
- Jars: { name, target, current, priority }
- User profile: { balance, income_pattern, spending_pattern, preferences }

### Implementation Approach:
- Use localStorage for data persistence
- Rule-based analytics + AI for natural language responses
- Simple CSV parsing for transaction import
- Proactive alert system based on spending patterns