"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Eye, EyeOff, Search, CheckCircle, Edit, XCircle, ChevronDown, Download, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { toast } from "sonner"
import type { TokenVisibility } from "@/lib/admin/tokenStore"
import type { PoolVisibility } from "@/lib/admin/poolStore"

export default function AdminExplorerPage() {
  const [activeTab, setActiveTab] = useState("tokens")
  const [tokens, setTokens] = useState<TokenVisibility[]>([])
  const [pools, setPools] = useState<PoolVisibility[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenVisibility | null>(null)
  const [editForm, setEditForm] = useState({
    logoUrl: "",
    category: "",
    description: "",
    tradeUrl: "",
    appUrl: "",
    circulatingSupply: "",
    totalSupply: "",
    marketCap: "",
    website: "",
    twitter: "",
    telegram: "",
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    tokenId: string
    action: string
    tokenSymbol: string
  }>({
    open: false,
    tokenId: "",
    action: "",
    tokenSymbol: "",
  })

  const loadTokens = async () => {
    try {
      const response = await fetch("/api/admin/tokens")
      const data = await response.json()
      setTokens(data)
    } catch (error) {
      console.error("[v0] Failed to load tokens:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPools = async () => {
    try {
      const response = await fetch("/api/admin/pools")
      const data = await response.json()
      setPools(data)
    } catch (error) {
      console.error("[v0] Failed to load pools:", error)
    }
  }

  useEffect(() => {
    loadTokens()
    loadPools()
  }, [])

  const handleToggleVisibility = (tokenId: string, currentlyHidden: boolean, tokenSymbol: string) => {
    if (!currentlyHidden) {
      setConfirmDialog({
        open: true,
        tokenId,
        action: "hide",
        tokenSymbol,
      })
    } else {
      toggleVisibility(tokenId, currentlyHidden)
    }
  }

  const toggleVisibility = async (tokenId: string, currentlyHidden: boolean) => {
    try {
      const response = await fetch("/api/admin/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          action: currentlyHidden ? "show" : "hide",
        }),
      })

      if (response.ok) {
        loadTokens()
        loadPools()
        setConfirmDialog({ open: false, tokenId: "", action: "", tokenSymbol: "" })
      }
    } catch (error) {
      console.error("[v0] Failed to update token visibility:", error)
    }
  }

  const handleToggleVerification = async (tokenId: string, currentlyVerified: boolean) => {
    try {
      const response = await fetch("/api/admin/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          action: currentlyVerified ? "unverify" : "verify",
        }),
      })

      if (response.ok) {
        loadTokens()
      }
    } catch (error) {
      console.error("[v0] Failed to update token verification:", error)
    }
  }

  const handleEditToken = (token: TokenVisibility) => {
    setSelectedToken(token)
    setEditForm({
      logoUrl: token.logoUrl || "",
      category: token.category || "",
      description: token.description || "",
      tradeUrl: token.tradeUrl || "",
      appUrl: token.appUrl || "",
      circulatingSupply: token.circulatingSupply || "",
      totalSupply: token.totalSupply || "",
      marketCap: token.marketCap || "",
      website: token.website || "",
      twitter: token.twitter || "",
      telegram: token.telegram || "",
    })
    setEditDialogOpen(true)
  }

  const handleSaveMetadata = async () => {
    if (!selectedToken) return

    try {
      const response = await fetch("/api/admin/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: selectedToken.id,
          action: "updateMetadata",
          metadata: editForm,
        }),
      })

      if (response.ok) {
        loadTokens()
        setEditDialogOpen(false)
      }
    } catch (error) {
      console.error("[v0] Failed to update token metadata:", error)
    }
  }

  const handleTogglePoolVisibility = async (poolId: string, currentlyHidden: boolean) => {
    try {
      const response = await fetch("/api/admin/pools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId,
          action: currentlyHidden ? "show" : "hide",
        }),
      })

      if (response.ok) {
        loadPools()
      }
    } catch (error) {
      console.error("[v0] Failed to update pool visibility:", error)
    }
  }

  const handleSyncTokens = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/admin/tokens/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Synced ${data.count} tokens to database`)
        loadTokens()
      } else {
        toast.error(data.error || "Failed to sync tokens")
      }
    } catch (error) {
      console.error("[v0] Failed to sync tokens:", error)
      toast.error("Failed to sync tokens from Horizon")
    } finally {
      setSyncing(false)
    }
  }

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.issuer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVisibility =
      visibilityFilter === "all" ||
      (visibilityFilter === "visible" && !token.isHidden) ||
      (visibilityFilter === "hidden" && token.isHidden)
    return matchesSearch && matchesVisibility
  })

  const filteredPools = pools.filter((pool) => {
    const matchesSearch =
      pool.tokenCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.mainPair.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVisibility =
      visibilityFilter === "all" ||
      (visibilityFilter === "visible" && !pool.isHidden) ||
      (visibilityFilter === "hidden" && pool.isHidden)
    return matchesSearch && matchesVisibility
  })

  const visibleTokenCount = tokens.filter((t) => !t.isHidden).length
  const hiddenTokenCount = tokens.filter((t) => t.isHidden).length
  const verifiedTokenCount = tokens.filter((t) => t.verified).length
  
  const visiblePoolCount = pools.filter((p) => !p.isHidden).length
  const hiddenPoolCount = pools.filter((p) => p.isHidden).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-balance text-3xl font-bold tracking-tight">Explorer Management</h1>
          <p className="text-pretty text-muted-foreground">
            Control token visibility and curate the explorer experience
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-3 md:grid-cols-3">
          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="p-0 pb-2 space-y-0.5">
              <CardTitle className="text-xs sm:text-sm">Total Tokens</CardTitle>
              <CardDescription className="text-xs hidden sm:block">All tokens in registry</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{tokens.length}</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="p-0 pb-2 space-y-0.5">
              <CardTitle className="text-xs sm:text-sm">Visible</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Shown in explorer</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{visibleTokenCount}</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="p-0 pb-2 space-y-0.5">
              <CardTitle className="text-xs sm:text-sm">Hidden</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Not shown to users</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-muted-foreground">{hiddenTokenCount}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="pools">Liquidity Pools</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Control</CardTitle>
                <CardDescription>Manage token visibility, verification, and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tokens.length === 0 && (
                  <div className="rounded-lg border border-dashed border-yellow-600 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-900 font-medium">No tokens in database yet</p>
                    <p className="text-xs text-yellow-700 mt-1">Click "Fetch & Sync Tokens" to import tokens from Horizon API</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleSyncTokens}
                  disabled={syncing}
                  variant="default"
                  className="gap-2"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Syncing Tokens...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Fetch & Sync Tokens from Horizon
                    </>
                  )}
                </Button>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by symbol or issuer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tokens</SelectItem>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading tokens...</p>
                ) : filteredTokens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || visibilityFilter !== "all"
                      ? "No tokens match your filters"
                      : "No tokens found"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Desktop Table Header - Hidden on mobile */}
                    <div className="hidden lg:grid lg:grid-cols-[1fr,auto,auto,auto] gap-4 rounded-lg border bg-muted/50 p-3 text-sm font-medium">
                      <div>Token</div>
                      <div>Verification</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>

                    {/* Token Items */}
                    {filteredTokens.map((token) => (
                      <Card key={token.id} className="p-0 overflow-hidden">
                        <Collapsible>
                          {/* Summary View - Always Visible */}
                          <div className="p-3 sm:p-4 lg:p-3">
                            <div className="lg:grid lg:grid-cols-[1fr,auto,auto,auto] lg:gap-4 lg:items-center">
                              {/* Token Info */}
                              <div className="space-y-1 mb-3 lg:mb-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm sm:text-base">{token.symbol}</p>
                                  {token.verified && (
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                  )}
                                  {token.category && (
                                    <Badge variant="secondary" className="text-xs">{token.category}</Badge>
                                  )}
                                </div>
                                <p className="font-mono text-xs text-muted-foreground break-all sm:break-normal">
                                  {token.issuer.substring(0, 12)}...{token.issuer.substring(token.issuer.length - 8)}
                                </p>
                              </div>

                              {/* Desktop: Verification, Status, Actions */}
                              <div className="hidden lg:flex items-center">
                                <Button
                                  size="sm"
                                  variant={token.verified ? "default" : "outline"}
                                  onClick={() => handleToggleVerification(token.id, token.verified)}
                                  className="gap-2"
                                >
                                  {token.verified ? (
                                    <>
                                      <CheckCircle className="h-4 w-4" />
                                      Verified
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4" />
                                      Unverified
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="hidden lg:flex items-center">
                                {token.isHidden ? (
                                  <Badge variant="outline" className="gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="gap-1 bg-green-600">
                                    <Eye className="h-3 w-3" />
                                    Visible
                                  </Badge>
                                )}
                              </div>
                              <div className="hidden lg:flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditToken(token)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant={token.isHidden ? "default" : "outline"}
                                  onClick={() => handleToggleVisibility(token.id, token.isHidden, token.symbol)}
                                  className="gap-2"
                                >
                                  {token.isHidden ? (
                                    <>
                                      <Eye className="h-4 w-4" />
                                      Show
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-4 w-4" />
                                      Hide
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Mobile: Quick actions + expand toggle */}
                              <div className="flex items-center gap-2 mt-3 lg:hidden">
                                {token.isHidden ? (
                                  <Badge variant="outline" className="gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="gap-1 bg-green-600">
                                    <Eye className="h-3 w-3" />
                                    Visible
                                  </Badge>
                                )}
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="ml-auto gap-1">
                                    <span className="text-xs">More</span>
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Details - Mobile Only */}
                          <CollapsibleContent>
                            <div className="border-t p-3 sm:p-4 bg-muted/30 space-y-3 lg:hidden">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Verification</p>
                                <Button
                                  size="sm"
                                  variant={token.verified ? "default" : "outline"}
                                  onClick={() => handleToggleVerification(token.id, token.verified)}
                                  className="gap-2 w-full"
                                >
                                  {token.verified ? (
                                    <>
                                      <CheckCircle className="h-4 w-4" />
                                      Verified
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4" />
                                      Unverified
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Actions</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditToken(token)}
                                    className="gap-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={token.isHidden ? "default" : "outline"}
                                    onClick={() => handleToggleVisibility(token.id, token.isHidden, token.symbol)}
                                    className="gap-2"
                                  >
                                    {token.isHidden ? (
                                      <>
                                        <Eye className="h-4 w-4" />
                                        Show
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-4 w-4" />
                                        Hide
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                              {(token.description || token.logoUrl || token.tradeUrl || token.appUrl) && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Metadata</p>
                                  <div className="space-y-1 text-xs">
                                    {token.logoUrl && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Logo:</span>
                                        <span className="truncate">{token.logoUrl}</span>
                                      </div>
                                    )}
                                    {token.description && (
                                      <div>
                                        <span className="text-muted-foreground">Description:</span>
                                        <p className="text-foreground mt-0.5">{token.description}</p>
                                      </div>
                                    )}
                                    {token.tradeUrl && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Trade:</span>
                                        <span className="truncate">{token.tradeUrl}</span>
                                      </div>
                                    )}
                                    {token.appUrl && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">App:</span>
                                        <span className="truncate">{token.appUrl}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pools" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Liquidity Pool Control</CardTitle>
                <CardDescription>Manage pool visibility (pools auto-hide when token is hidden)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by token or pair..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pools</SelectItem>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading pools...</p>
                ) : filteredPools.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || visibilityFilter !== "all"
                      ? "No pools match your filters"
                      : "No pools found"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Desktop Table Header - Hidden on mobile */}
                    <div className="hidden md:grid md:grid-cols-[1fr,auto,auto] gap-4 rounded-lg border bg-muted/50 p-3 text-sm font-medium">
                      <div>Pool</div>
                      <div>Status</div>
                      <div>Action</div>
                    </div>

                    {/* Pool Items */}
                    {filteredPools.map((pool) => (
                      <Card key={pool.id} className="p-3 sm:p-4 md:p-3 overflow-hidden">
                        <div className="md:grid md:grid-cols-[1fr,auto,auto] md:gap-4 md:items-center">
                          {/* Pool Info */}
                          <div className="space-y-1 mb-3 md:mb-0">
                            <p className="font-semibold text-sm sm:text-base">{pool.mainPair}</p>
                            <p className="text-xs text-muted-foreground">
                              {pool.tokenCode} • {pool.tokenIssuer.substring(0, 12)}...
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center mb-3 md:mb-0">
                            {pool.isHidden ? (
                              <Badge variant="outline" className="gap-1">
                                <EyeOff className="h-3 w-3" />
                                Hidden
                              </Badge>
                            ) : (
                              <Badge variant="default" className="gap-1 bg-green-600">
                                <Eye className="h-3 w-3" />
                                Visible
                              </Badge>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center">
                            <Button
                              size="sm"
                              variant={pool.isHidden ? "default" : "outline"}
                              onClick={() => handleTogglePoolVisibility(pool.id, pool.isHidden)}
                              className="gap-2 w-full md:w-auto"
                            >
                              {pool.isHidden ? (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Show
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Hide
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Token Metadata Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Edit Token Metadata</DialogTitle>
              <DialogDescription className="text-sm">
                Update logo, category, description, and action URLs for {selectedToken?.symbol}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="logoUrl" className="text-xs sm:text-sm">Logo URL</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  value={editForm.logoUrl}
                  onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Game">Game</SelectItem>
                    <SelectItem value="NFT">NFT</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Token description (shown in About card)..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="tradeUrl" className="text-xs sm:text-sm">Trade URL</Label>
                <Input
                  id="tradeUrl"
                  type="url"
                  placeholder="https://pidex.io/trade/TOKEN"
                  value={editForm.tradeUrl}
                  onChange={(e) => setEditForm({ ...editForm, tradeUrl: e.target.value })}
                  className="text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">URL for Trade on PI DEX button</p>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="appUrl" className="text-xs sm:text-sm">App URL</Label>
                <Input
                  id="appUrl"
                  type="url"
                  placeholder="https://app.example.com"
                  value={editForm.appUrl}
                  onChange={(e) => setEditForm({ ...editForm, appUrl: e.target.value })}
                  className="text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">URL for App button redirect</p>
              </div>

              {/* Divider */}
              <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-semibold text-sm mb-3">Token Metrics</h4>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="circulatingSupply" className="text-xs sm:text-sm">Circulating Supply</Label>
                <Input
                  id="circulatingSupply"
                  placeholder="1,000,000"
                  value={editForm.circulatingSupply}
                  onChange={(e) => setEditForm({ ...editForm, circulatingSupply: e.target.value })}
                  className="text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Number of tokens in circulation</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="totalSupply" className="text-xs sm:text-sm">Total Supply</Label>
                <Input
                  id="totalSupply"
                  placeholder="10,000,000"
                  value={editForm.totalSupply}
                  onChange={(e) => setEditForm({ ...editForm, totalSupply: e.target.value })}
                  className="text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Maximum token supply</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="marketCap" className="text-xs sm:text-sm">Market Cap (π)</Label>
                <Input
                  id="marketCap"
                  placeholder="500,000"
                  value={editForm.marketCap}
                  onChange={(e) => setEditForm({ ...editForm, marketCap: e.target.value })}
                  className="text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Market capitalization in Pi</p>
              </div>

              {/* Divider */}
              <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-semibold text-sm mb-3">Social Links</h4>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="website" className="text-xs sm:text-sm">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="twitter" className="text-xs sm:text-sm">Twitter</Label>
                <Input
                  id="twitter"
                  placeholder="@tokenname"
                  value={editForm.twitter}
                  onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="telegram" className="text-xs sm:text-sm">Telegram</Label>
                <Input
                  id="telegram"
                  placeholder="t.me/tokengroup"
                  value={editForm.telegram}
                  onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSaveMetadata} className="w-full sm:w-auto">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          onConfirm={() => {
            const token = tokens.find((t) => t.id === confirmDialog.tokenId)
            if (token) {
              toggleVisibility(confirmDialog.tokenId, token.isHidden)
            }
          }}
          title="Hide Token?"
          description={`Are you sure you want to hide ${confirmDialog.tokenSymbol}? This token will no longer be visible in the public explorer.`}
          confirmText="Hide Token"
          variant="destructive"
        />
      </div>
    </AdminLayout>
  )
}
