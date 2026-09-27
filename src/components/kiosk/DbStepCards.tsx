'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import type { ScreenStep } from '@/hooks/use-kiosk-content';

/**
 * Admin-driven step cards (ContentSection rows). Rendered when a screen has
 * sections; otherwise screens keep their hardcoded fallbacks with icons.
 */
export function DbStepCards({ steps }: { steps: ScreenStep[] }) {
  return (
    <>
      {steps.map((step, index) => (
        <motion.div
          key={`${step.order}-${step.title}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="kiosk-card">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                {step.lines.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {step.lines.map((line, i) => (
                      <p key={i} className="text-base leading-relaxed text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </>
  );
}
