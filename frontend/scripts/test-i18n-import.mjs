try {
  const { VALID_LOCALES } = await import('../src/lib/appPreferences.ts')
  const { translate, MESSAGES } = await import('../src/lib/i18n/messages.ts')
  const chatCopy = await import('../src/lib/i18n/chatCopy.ts')
  console.log('VALID_LOCALES', VALID_LOCALES)
  console.log('MESSAGES keys', Object.keys(MESSAGES))
  console.log('isDefault', chatCopy.isDefaultConversationTitle('新对话'))
  console.log('OK')
} catch (e) {
  console.error('FAIL', e)
  process.exit(1)
}
