"use client";

import { useState, useCallback } from "react";
import {
  deposit,
  withdraw,
  swap,
  getBalance,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ArrowDownUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 8h5" />
      <path d="M3 16h5" />
      <path d="M21 12a9 9 0 0 1-9-9 9.75 9.75 0 0 0 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Token Badge ──────────────────────────────────────────────

function TokenBadge({ symbol }: { symbol: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/70">
      {symbol}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "deposit" | "withdraw" | "swap" | "balance";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("deposit");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Deposit state
  const [depositToken, setDepositToken] = useState("USDC");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  // Withdraw state
  const [withdrawToken, setWithdrawToken] = useState("USDC");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Swap state
  const [swapFromToken, setSwapFromToken] = useState("USDC");
  const [swapToToken, setSwapToToken] = useState("XLM");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapRate, setSwapRate] = useState("1");
  const [isSwapping, setIsSwapping] = useState(false);

  // Balance state
  const [balanceToken, setBalanceToken] = useState("USDC");
  const [balanceUser, setBalanceUser] = useState("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState<bigint | null>(null);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleDeposit = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!depositToken.trim() || !depositAmount.trim()) return setError("Fill in all fields");
    const amount = BigInt(depositAmount);
    if (amount <= BigInt(0)) return setError("Amount must be positive");
    setError(null);
    setIsDepositing(true);
    setTxStatus("Awaiting signature...");
    try {
      await deposit(walletAddress, depositToken.trim(), amount);
      setTxStatus("Deposit successful!");
      setDepositAmount("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsDepositing(false);
    }
  }, [walletAddress, depositToken, depositAmount]);

  const handleWithdraw = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!withdrawToken.trim() || !withdrawAmount.trim()) return setError("Fill in all fields");
    const amount = BigInt(withdrawAmount);
    if (amount <= BigInt(0)) return setError("Amount must be positive");
    setError(null);
    setIsWithdrawing(true);
    setTxStatus("Awaiting signature...");
    try {
      await withdraw(walletAddress, withdrawToken.trim(), amount);
      setTxStatus("Withdrawal successful!");
      setWithdrawAmount("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsWithdrawing(false);
    }
  }, [walletAddress, withdrawToken, withdrawAmount]);

  const handleSwap = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!swapFromToken.trim() || !swapToToken.trim() || !swapAmount.trim() || !swapRate.trim()) {
      return setError("Fill in all fields");
    }
    const amount = BigInt(swapAmount);
    const rate = BigInt(swapRate);
    if (amount <= BigInt(0)) return setError("Amount must be positive");
    if (rate <= BigInt(0)) return setError("Rate must be positive");
    setError(null);
    setIsSwapping(true);
    setTxStatus("Awaiting signature...");
    try {
      await swap(walletAddress, swapFromToken.trim(), swapToToken.trim(), amount, rate);
      setTxStatus("Swap successful!");
      setSwapAmount("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsSwapping(false);
    }
  }, [walletAddress, swapFromToken, swapToToken, swapAmount, swapRate]);

  const handleGetBalance = useCallback(async () => {
    const user = balanceUser.trim() || walletAddress;
    if (!user) return setError("Connect wallet or enter address");
    if (!balanceToken.trim()) return setError("Select a token");
    setError(null);
    setIsLoadingBalance(true);
    setBalanceResult(null);
    try {
      const result = await getBalance(user, balanceToken.trim(), walletAddress || undefined);
      setBalanceResult(result as bigint);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [balanceUser, balanceToken, walletAddress]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "deposit", label: "Deposit", icon: <ArrowDownIcon />, color: "#34d399" },
    { key: "withdraw", label: "Withdraw", icon: <ArrowUpIcon />, color: "#f87171" },
    { key: "swap", label: "Swap", icon: <ArrowDownUpIcon />, color: "#7c6cf0" },
    { key: "balance", label: "Balance", icon: <WalletIcon />, color: "#4fc3f7" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("successful") || txStatus.includes("updated") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 8h5" />
                  <path d="M3 16h5" />
                  <path d="M21 12a9 9 0 0 1-9-9 9.75 9.75 0 0 0 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Simple DEX</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setBalanceResult(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Deposit */}
            {activeTab === "deposit" && (
              <div className="space-y-5">
                <MethodSignature name="deposit" params="(user: Address, token: Symbol, amount: i128)" color="#34d399" />
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Token</label>
                  <div className="flex gap-2">
                    {["USDC", "XLM", "ETH", "BTC"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setDepositToken(t)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                          depositToken === t
                            ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]"
                            : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Input 
                  label="Amount" 
                  type="number" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)} 
                  placeholder="e.g. 1000" 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleDeposit} disabled={isDepositing} shimmerColor="#34d399" className="w-full">
                    {isDepositing ? <><SpinnerIcon /> Depositing...</> : <><ArrowDownIcon /> Deposit</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to deposit
                  </button>
                )}
              </div>
            )}

            {/* Withdraw */}
            {activeTab === "withdraw" && (
              <div className="space-y-5">
                <MethodSignature name="withdraw" params="(user: Address, token: Symbol, amount: i128)" color="#f87171" />
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Token</label>
                  <div className="flex gap-2">
                    {["USDC", "XLM", "ETH", "BTC"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setWithdrawToken(t)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                          withdrawToken === t
                            ? "border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]"
                            : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Input 
                  label="Amount" 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)} 
                  placeholder="e.g. 500" 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleWithdraw} disabled={isWithdrawing} shimmerColor="#f87171" className="w-full">
                    {isWithdrawing ? <><SpinnerIcon /> Withdrawing...</> : <><ArrowUpIcon /> Withdraw</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#f87171]/20 bg-[#f87171]/[0.03] py-4 text-sm text-[#f87171]/60 hover:border-[#f87171]/30 hover:text-[#f87171]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to withdraw
                  </button>
                )}
              </div>
            )}

            {/* Swap */}
            {activeTab === "swap" && (
              <div className="space-y-5">
                <MethodSignature name="swap" params="(user, token_in, token_out, amount, rate)" color="#7c6cf0" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">From</label>
                    <div className="flex gap-2">
                      {["USDC", "XLM", "ETH", "BTC"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSwapFromToken(t)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                            swapFromToken === t
                              ? "border-[#7c6cf0]/30 bg-[#7c6cf0]/10 text-[#7c6cf0]"
                              : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">To</label>
                    <div className="flex gap-2">
                      {["USDC", "XLM", "ETH", "BTC"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSwapToToken(t)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                            swapToToken === t
                              ? "border-[#7c6cf0]/30 bg-[#7c6cf0]/10 text-[#7c6cf0]"
                              : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Input 
                  label="Amount" 
                  type="number" 
                  value={swapAmount} 
                  onChange={(e) => setSwapAmount(e.target.value)} 
                  placeholder="e.g. 100" 
                />
                <Input 
                  label="Rate (output = amount × rate)" 
                  type="number" 
                  value={swapRate} 
                  onChange={(e) => setSwapRate(e.target.value)} 
                  placeholder="e.g. 2" 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleSwap} disabled={isSwapping} shimmerColor="#7c6cf0" className="w-full">
                    {isSwapping ? <><SpinnerIcon /> Swapping...</> : <><ArrowDownUpIcon /> Swap</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to swap
                  </button>
                )}
              </div>
            )}

            {/* Balance */}
            {activeTab === "balance" && (
              <div className="space-y-5">
                <MethodSignature name="get_balance" params="(user: Address, token: Symbol)" returns="-> i128" color="#4fc3f7" />
                {!walletAddress && (
                  <Input 
                    label="Wallet Address (optional if connected)" 
                    value={balanceUser} 
                    onChange={(e) => setBalanceUser(e.target.value)} 
                    placeholder="G... address" 
                  />
                )}
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Token</label>
                  <div className="flex gap-2">
                    {["USDC", "XLM", "ETH", "BTC"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setBalanceToken(t)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                          balanceToken === t
                            ? "border-[#4fc3f7]/30 bg-[#4fc3f7]/10 text-[#4fc3f7]"
                            : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <ShimmerButton onClick={handleGetBalance} disabled={isLoadingBalance} shimmerColor="#4fc3f7" className="w-full">
                  {isLoadingBalance ? <><SpinnerIcon /> Loading...</> : <><WalletIcon /> Check Balance</>}
                </ShimmerButton>

                {balanceResult !== null && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Balance</span>
                      <TokenBadge symbol={balanceToken} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Amount</span>
                        <span className="font-mono text-lg text-white/90">{balanceResult.toString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Simple DEX &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white/15">Testnet</span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
