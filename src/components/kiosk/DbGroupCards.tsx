'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveImage } from '@/components/kiosk/ResponsiveImage';
import { stepText, type ScreenGroup } from '@/hooks/use-kiosk-content';

/**
 * Admin-driven grouped cards (ContentSection rows with parentKey grouping).
 * Each group renders as a card; children render as numbered rows.
 */
export function DbGroupCards({ groups }: { groups: ScreenGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <motion.div
          key={group.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="kiosk-card">
            <CardContent className="p-6">
              <h3 className="mb-4 text-xl font-semibold">{group.title}</h3>
              {group.imageUrl && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  <ResponsiveImage
                    src={group.imageUrl}
                    fallbackSrc="/kiosk-images/equipment.png"
                    alt={group.title}
                    width={800}
                    height={450}
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-4">
                {group.children.map((child, index) => (
                  <div key={`${child.order}-${child.title}`} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">{child.title}</h4>
                      {child.lines.length > 0 && (
                        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                          {child.lines.join(' ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </>
  );
}

export { stepText };
