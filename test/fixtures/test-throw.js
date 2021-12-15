/**
 * @param {Function} fn
 * @param {string} message
 */
export const testThrowSync = (fn, message) => {
  try {
    fn()
  } catch (e) {
    if (/** @type {Error} */(e).message !== message) throw e
    return
  }
  /* c8 ignore next */
  throw new Error('Test failed to throw')
}

/**
 * @param {Function} fn
 * @param {string} message
 */
export const testThrowAsync = async (fn, message) => {
  try {
    await fn()
  } catch (e) {
    if (/** @type {Error} */(e).message !== message) throw e
    return
  }
  /* c8 ignore next */
  throw new Error('Test failed to throw')
}
