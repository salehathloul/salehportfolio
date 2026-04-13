"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

// Simple per-page fade-in + slight lift.
// AnimatePresence mode="wait" conflicts with App Router's rendering model
// (multiple children during transitions), so we use a keyed motion.div instead.
export default function PageTransition({ children }: Props) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
}
