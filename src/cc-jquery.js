// @flow

import check, { checkClassNamesAreStringOrNull } from './util/check.js'
const init = (cc, $) => {
  $.cc = cc

  const getter = function () {
    const $el = this
    const dom: HTMLElement = $el[0]

    check(dom != null, 'cc (class-component context) is unavailable at empty dom selection')

    let cc = (dom: any).cc

    if (!cc) {
      /**
       * Initializes the element as class-component of the given names. If the names not given, then initializes it by the class-component of the class names it already has.
       * @param {?string} classNames The class component names
       * @return {jQuery}
       */
      cc = (dom: any).cc = (classNames: ?string) => {
        checkClassNamesAreStringOrNull(classNames)

        ;(classNames || dom.className).split(/\s+/).map(className => {
          if (ccc[className]) {
            ccc[className]($el.addClass(className)[0])
          }
        })

        return $el
      }

      /**
       * Gets the coelement of the given name.
       * @param {string} name The name of the coelement
       * @return {Object}
       */
      cc.get = (name: string) => get(name, dom)

      cc.init = (className: string) => cc(className).cc.get(className)
    }

    return cc
  }

  // Defines the special property cc on the jquery prototype.
  Object.defineProperty($.fn, 'cc', { get: getter })

  // Applies jQuery initializer plugin
  plugins.push((el: HTMLElement, coel: any) => { coel.$el = $(el) })
}

if (typeof self !== 'undefined' && self.cc && self.$ && !self.$.cc) {
  init(cc, $)
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init
}