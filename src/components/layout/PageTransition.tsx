import * as React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
}

const childVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const StaggerItem: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => (
  <motion.div variants={childVariants} className={className}>
    {children}
  </motion.div>
)

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn('w-full flex-1', className)}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}

export { PageTransition, StaggerItem }
