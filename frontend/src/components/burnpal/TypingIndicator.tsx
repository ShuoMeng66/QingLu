import { motion } from 'framer-motion'
import { useI18n } from '../../hooks/useI18n'

const DOT_VARIANTS = {
  initial: { y: 0 },
  animate: { y: [-4, 0, -4] },
}

const dotTransition = (index: number) => ({
  duration: 0.6,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  delay: index * 0.15,
})

export function TypingIndicator() {
  const { t } = useI18n()

  return (
    <div className="flex items-center gap-1.5 px-1 py-2" aria-label={t('typing.thinking')}>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="inline-block h-2 w-2 rounded-full bg-emerald-400"
          variants={DOT_VARIANTS}
          initial="initial"
          animate="animate"
          transition={dotTransition(index)}
        />
      ))}
    </div>
  )
}
