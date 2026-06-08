"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface AboutPageProps {
  onClose: () => void
}

export function AboutPage({ onClose }: AboutPageProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 text-lg font-semibold">Litepaper </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Main Content */}
        <div className="space-y-8 text-foreground/90 leading-relaxed">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">W3C Living Litepaper (v0.1)</h2>
            <p className="text-lg text-foreground/80 mb-6">Web3 Currency Infrastructure for the Pi Network Ecosystem</p>
          </div>

          {/* Section 1: Overview */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">1. Overview</h3>
            <p className="mb-3">
              W3C is early-stage Web3 infrastructure being developed and tested within the Pi Network ecosystem.
            </p>
            <p className="mb-3">
              The project focuses on providing foundational tools that support discovery, visibility, and structured engagement for Pi-based applications and their associated business tokens as the ecosystem continues to evolve.
            </p>
            <p>
              W3C is currently in testnet and is being built iteratively. Features and structure may change as development progresses and as the Pi ecosystem matures.
            </p>
          </div>

          {/* Section 2: Ecosystem Context */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">2. Ecosystem Context</h3>
            <p className="mb-3">
              The Pi Network ecosystem is in an early and active stage of development.
            </p>
            <p className="mb-3">
              Applications, utilities, and business tokens are still being explored, tested, and refined. Patterns of usage and engagement are continuing to emerge rather than being fully established.
            </p>
            <p>
              W3C is designed to operate within this early environment by providing infrastructure that can adapt alongside ecosystem growth rather than reacting after challenges appear at scale.
            </p>
          </div>

          {/* Section 3: Pi Business Tokens */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">3. Pi Business Tokens</h3>
            <p className="mb-3">
              Pi business tokens are utility-oriented tokens associated with specific Pi applications.
            </p>
            <p className="mb-3">They are typically:</p>
            <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
              <li>Issued by Pi applications</li>
              <li>Tied to functional use cases within those applications</li>
              <li>Intended to support interaction, participation, or access</li>
            </ul>
            <p>
              As more applications experiment with token-based utility, the need for visibility and structured interaction is expected to grow. W3C is built with this direction in mind.
            </p>
          </div>

          {/* Section 4: W3C Product Components */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">4. W3C Product Components</h3>
            <p className="mb-4">
              W3C currently consists of two core components under active development and testing.
            </p>

            {/* 4.1 Explorer */}
            <div className="mb-6 pl-4 border-l-2 border-primary/50">
              <h4 className="text-lg font-semibold mb-3 text-foreground">4.1 Explorer</h4>
              <p className="mb-3">
                The W3C Explorer is a discovery and tracking interface for Pi business tokens and their related applications.
              </p>
              <p className="mb-3">Its purpose is to:</p>
              <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
                <li>Provide visibility into listed Pi business tokens</li>
                <li>Display available testnet data where applicable</li>
                <li>Act as a reference layer for ecosystem exploration</li>
              </ul>
              <p>
                The Explorer is intended to evolve alongside the ecosystem as standards and usage patterns become clearer.
              </p>
            </div>

            {/* 4.2 Quest Hub */}
            <div className="pl-4 border-l-2 border-primary/50">
              <h4 className="text-lg font-semibold mb-3 text-foreground">4.2 Quest Hub</h4>
              <p className="mb-3">
                The W3C Quest Hub is an engagement-focused component designed to support interaction between applications and users.
              </p>
              <p className="mb-3">It enables:</p>
              <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
                <li>Application builders to create and list quests</li>
                <li>Use of W3C tokens as part of quest listing and participation</li>
                <li>Users to engage with applications through structured tasks</li>
              </ul>
              <p>
                The Quest Hub is designed to encourage participation in a way that aligns with application utility rather than passive attention.
              </p>
            </div>
          </div>

          {/* Section 5: W3C Token Utility */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">5. W3C Token Utility</h3>
            <p className="mb-3">
              The W3C token functions as a utility token within the W3C platform.
            </p>
            <p className="mb-3">Its current and intended uses include:</p>
            <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
              <li>Supporting quest creation and participation</li>
              <li>Enabling reward distribution for user engagement</li>
              <li>Facilitating circulation tied to platform activity</li>
            </ul>
            <p>
              The token is designed for functional use within the W3C environment and is not positioned as a speculative asset.
            </p>
          </div>

          {/* Section 6: Development Approach */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">6. Development Approach</h3>
            <p className="mb-3">
              W3C is being developed with the following principles:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
              <li>Incremental releases</li>
              <li>Testnet-first experimentation</li>
              <li>Simplicity before complexity</li>
              <li>Alignment with Pi Network guidelines</li>
              <li>Adaptability based on real usage signals</li>
            </ul>
            <p>
              Not all features are implemented at once. Components may be introduced, refined, or adjusted over time.
            </p>
          </div>

          {/* Section 7: Future Considerations */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">7. Future Considerations</h3>
            <p className="mb-3">
              As the Pi ecosystem continues to grow, additional tools may be explored to improve usability, navigation, and data interpretation.
            </p>
            <p className="mb-3">These considerations depend on:</p>
            <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
              <li>Ecosystem maturity</li>
              <li>Resource availability</li>
              <li>Platform stability</li>
              <li>Demonstrated need from users and builders</li>
            </ul>
            <p>
              No future features are guaranteed or scheduled.
            </p>
          </div>

          {/* Section 8: Transparency and Iteration */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">8. Transparency and Iteration</h3>
            <p className="mb-3">
              This document represents the current state and direction of W3C. It is a living document and may be updated as:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
              <li>Features evolve</li>
              <li>Infrastructure improves</li>
              <li>The ecosystem develops</li>
              <li>Feedback is incorporated</li>
            </ul>
            <p>
              Changes to this document reflect learning and iteration rather than deviation from intent.
            </p>
          </div>

          {/* Closing Note */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="text-xl font-semibold mb-3 text-foreground">Closing Note</h3>
            <p>
              W3C is an evolving infrastructure layer designed to grow alongside the Pi Network ecosystem. Its purpose is to support exploration, participation, and structured engagement in a way that respects the early and experimental nature of the ecosystem.
            </p>
          </div>

          {/* Version Info */}
          <div className="text-center pt-6 pb-4 border-t">
            <p className="text-sm text-muted-foreground">W3C Living Litepaper v0.1 </p>
          </div>
        </div>
      </div>
    </div>
  )
}
