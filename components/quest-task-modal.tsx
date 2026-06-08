"use client"

import React from "react"

import { X, Upload, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"

interface TaskDetailModalProps {
  isOpen: boolean
  taskTitle: string
  taskDescription: string
  taskType: "social" | "onchain" | "offchain" | "referral"
  xpReward: number
  onClose: () => void
  onSubmit?: (proof: string) => void
}

export function QuestTaskModal({
  isOpen,
  taskTitle,
  taskDescription,
  taskType,
  xpReward,
  onClose,
  onSubmit,
}: TaskDetailModalProps) {
  const [proof, setProof] = useState("")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getTypeLabel = () => {
    const map = {
      onchain: "On-Chain Task",
      offchain: "Off-Chain Task",
      referral: "Referral Task",
      social: "Social Task",
    }
    return map[taskType]
  }

  // Social & Off-Chain tasks require screenshot proof
  const requiresScreenshot = taskType === "social" || taskType === "offchain"
  // On-Chain tasks require transaction hash
  const requiresTransactionHash = taskType === "onchain"
  // Referral tasks require referral info
  const requiresReferralInfo = taskType === "referral"

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setProofFile(file)
      setProof(file.name)
    }
  }

  const isProofValid = () => {
    if (requiresScreenshot) {
      return proofFile !== null
    }
    if (requiresTransactionHash) {
      return proof.trim().length > 0 && /^0x[a-fA-F0-9]{64}$/.test(proof)
    }
    if (requiresReferralInfo) {
      return proof.trim().length > 0
    }
    return true
  }

  const handleSubmit = () => {
    if (isProofValid()) {
      onSubmit?.(proof)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-md shadow-lg animate-in slide-in-from-bottom-4 sm:slide-in-from-center">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{getTypeLabel()}</p>
            <h2 className="text-lg font-bold mt-1">{taskTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{taskDescription}</p>
          </div>

          {/* Screenshot Upload for Social & Off-Chain Tasks */}
          {requiresScreenshot && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Submit Proof (Screenshot)</h3>
              <p className="text-xs text-muted-foreground">
                Upload a screenshot showing completion of this task
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-lg p-3 flex flex-col items-center gap-2 text-center"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {proofFile ? proofFile.name : "Click to upload screenshot"}
                </span>
                <span className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Transaction Hash Input for On-Chain Tasks */}
          {requiresTransactionHash && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Transaction Hash</h3>
              <p className="text-xs text-muted-foreground">
                Enter the transaction hash proving on-chain completion
              </p>
              <Input
                placeholder="0x... (64 character hex)"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                className="text-sm font-mono"
              />
              {proof && !/^0x[a-fA-F0-9]{64}$/.test(proof) && (
                <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>Invalid transaction hash format</span>
                </div>
              )}
            </div>
          )}

          {/* Referral Info for Referral Tasks */}
          {requiresReferralInfo && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Referral Information</h3>
              <p className="text-xs text-muted-foreground">
                Share your referral link or referred user IDs
              </p>
              <Input
                placeholder="Enter referral details..."
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {/* XP Info */}
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground">Reward upon completion</p>
            <p className="text-2xl font-bold text-primary">+{xpReward} XP</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-border">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!isProofValid()}
          >
            Claim Reward
          </Button>
        </div>
      </div>
    </div>
  )
}
