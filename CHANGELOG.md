# Changelog

All notable changes to this project will be documented here.

## [0.0.1] - 2025-08-11
### Added
- UI scaffold with Next.js (TS) + Tailwind.
- App providers for @mysten/sui + @mysten/dapp-kit + React Query.
- Top navigation with dApp Kit `ConnectButton`.
- Onboarding sheet with entry points for Wallet, zkLogin, and Passkey (UI only).
- Placeholder pages: Home, Explore, Agent, Profile.

### Notes
- No blockchain logic yet. Next step: wire **onboarding** (wallet, zkLogin, passkey) end-to-end.

## [0.0.2] - 2025-08-11
### Fixed
- RSC runtime error by moving React Query + @mysten/dapp-kit providers into `ClientProviders` (`'use client'`).
### Changed
- Imported dApp Kit CSS inside the client boundary.
- Wrapped `TopNav` and pages with `ClientProviders` in `layout.tsx`.


## [0.1.0] - 2025-08-11
### Added
- Slush-first wallet support by passing `slushWallet` to `WalletProvider`.
- `AccountBadge` component showing connected address + SUI balance using:
  - `useCurrentAccount`, `useSuiClientQuery('getBalance', ...)` from @mysten/dapp-kit.
  - `formatAddress`, `MIST_PER_SUI` from @mysten/sui/utils.

### Changed
- Top navigation now includes `AccountBadge` next to `ConnectButton`.

## [0.1.1] - 2025-08-11
### Fixed
- Typed `OnboardingSheet` props explicitly and ensured it is a client component.
- Resolved `useSuiClientQuery('getBalance')` typing by always passing a params object and gating with `enabled`.


