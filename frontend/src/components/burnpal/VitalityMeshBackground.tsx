import { motion } from 'framer-motion'

const ORB_FLOAT = {
  animate: { y: [0, -10, 0] },
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
}

/** Natural yellow-green fluid mesh · green dominant with soft lime sunshine */
export function VitalityMeshBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-gradient-to-br from-emerald-50 via-[#f0fdf4] to-[#e6f7ef]"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 z-0 opacity-[0.025] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-tr from-emerald-100/30 via-transparent to-lime-100/25"
        aria-hidden="true"
      />

      <motion.div className="absolute -left-24 -top-24" {...ORB_FLOAT}>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[520px] w-[520px] rounded-full bg-emerald-200/55 blur-[110px]"
        />
      </motion.div>

      <motion.div
        className="absolute -right-16 top-1/4"
        {...ORB_FLOAT}
        transition={{ ...ORB_FLOAT.transition, delay: 0.5 }}
      >
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[460px] w-[460px] rounded-full bg-lime-200/50 blur-[100px]"
        />
      </motion.div>

      <motion.div
        className="absolute -bottom-36 left-1/4"
        {...ORB_FLOAT}
        transition={{ ...ORB_FLOAT.transition, delay: 1 }}
      >
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[540px] w-[540px] rounded-full bg-green-200/45 blur-[130px]"
        />
      </motion.div>

      <motion.div
        className="absolute right-[8%] top-[6%]"
        {...ORB_FLOAT}
        transition={{ ...ORB_FLOAT.transition, delay: 1.5 }}
      >
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[320px] w-[320px] rounded-full bg-yellow-100/45 blur-[90px]"
        />
      </motion.div>

      <motion.div
        className="absolute bottom-[15%] right-[20%]"
        {...ORB_FLOAT}
        transition={{ ...ORB_FLOAT.transition, delay: 2 }}
      >
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[280px] w-[280px] rounded-full bg-lime-100/55 blur-[80px]"
        />
      </motion.div>
    </div>
  )
}
