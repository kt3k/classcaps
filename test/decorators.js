const {div} = require('dom-gen')
const assert = require('power-assert')
const $ = jQuery

/**
 * @param {Function} decorator The decorator
 * @param {Function} cls The class
 * @param {string} key The key of the method to decorate
 */
function callDecorator (decorator, cls, key) {
  const descriptor = Object.getOwnPropertyDescriptor(cls.prototype, key)
  const result = decorator(cls.prototype, key, descriptor)
  Object.defineProperty(cls.prototype, key, result || descriptor)
}

describe('@on(event)', () => {
  it('registers the method as the event listener of the given event name', done => {
    class OnTest0 {
      handler () { done() }
    }
    $.cc('on-test0', OnTest0)
    callDecorator($.cc.on('click'), OnTest0, 'handler')

    div().cc('on-test0').trigger('click')
  })
})

describe('@on(event).at(selector)', () => {
  it('registers the method as the event listener of the given event name and selector', done => {
    class OnAtTest0 {
      foo () { done() }
      bar () { done(new Error('bar should not be called')) }
    }
    $.cc('on-at-test0', OnAtTest0)
    callDecorator($.cc.on('foo-event').at('.inner'), OnAtTest0, 'foo')
    callDecorator($.cc.on('bar-event').at('.inner'), OnAtTest0, 'bar')

    const elem = div(div({addClass: 'inner'})).cc('on-at-test0')

    elem.trigger('bar-event')
    elem.find('.inner').trigger('foo-event')
  })
})

describe('@emit(event)', () => {
  it('makes the method emits the event with the arguments of the method', done => {
    class EmitTest0 {
      foo () {}
    }
    $.cc('emit-test0', EmitTest0)
    callDecorator($.cc.emit('event-foo'), EmitTest0, 'foo')

    div().on('event-foo', (e, a, b, c) => {
      assert(a === 1)
      assert(b === 2)
      assert(c === 3)

      done()
    }).cc.init('emit-test0').foo(1, 2, 3)
  })
})

describe('@emit(event).first', () => {
  it('is the same as @emit(event)', () => {
    const emit = $.cc.emit('event-foo')

    assert(emit.first === emit)
  })
})

describe('@emit(event).last', () => {
  it('makes the method emit the event with the returned value', done => {
    class EmitLastTest0 {
      foo () {
        return 321
      }
    }
    $.cc('emit-last-test0', EmitLastTest0)
    callDecorator($.cc.emit('event-foo').last, EmitLastTest0, 'foo')

    div().on('event-foo', (e, param) => {
      assert(param === 321)

      done()
    }).cc.init('emit-last-test0').foo()
  })

  it('makes the method emit the event with the resolved value after the promise resolved', done => {
    let promiseResolved = false

    class EmitLastTest1 {
      foo () {
        return new Promise(resolve => {
          setTimeout(() => {
            promiseResolved = true
            resolve(123)
          }, 100)
        })
      }
    }
    $.cc('emit-last-test1', EmitLastTest1)
    callDecorator($.cc.emit('event-foo').last, EmitLastTest1, 'foo')

    div().on('event-foo', (e, param) => {
      assert(promiseResolved)
      assert(param === 123)

      done()
    }).cc.init('emit-last-test1').foo()
  })
})

describe('@emit(event).on.error', () => {
  it('makes the method emit the event with the error as the parameter when the method throws', done => {
    class EmitOnErrorTest0 {
      foo () {
        throw new Error('abc')
      }
    }
    $.cc('emit-on-error-test0', EmitOnErrorTest0)
    callDecorator($.cc.emit('event-foo').on.error, EmitOnErrorTest0, 'foo')

    div().on('event-foo', (e, err) => {
      assert(err instanceof Error)
      assert(err.message === 'abc')

      done()
    }).cc.init('emit-on-error-test0').foo()
  })

  it('makes the method emit the event with the error as the parameter when the method returns rejected promise', done => {
    let promiseRejected = true

    class EmitOnErrorTest1 {
      foo () {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            promiseRejected = true

            reject(new Error('abc'))
          }, 100)
        })
      }
    }
    $.cc('emit-on-error-test1', EmitOnErrorTest1)
    callDecorator($.cc.emit('event-foo').on.error, EmitOnErrorTest1, 'foo')

    div().on('event-foo', (e, err) => {
      assert(err instanceof Error)
      assert(err.message === 'abc')
      assert(promiseRejected)

      done()
    }).cc.init('emit-on-error-test1').foo()
  })
})

describe('@component(className)', () => {
  it('works as a class decorator and registers the class as a class component of the given name', () => {
    class Cls {
      constructor (elem) {
        elem.attr('this-is', 'decorated-component')
      }
    }

    $.cc.component('decorated-component')(Cls)

    const elem = $('<div />')

    elem.cc.init('decorated-component')

    assert(elem.attr('this-is') === 'decorated-component')
  })
})

describe('@wire', () => {
  it('replaces the getter of the decorated descriptor, and it returns the instance of class-component inside the element', () => {
    class Cls0 {
      get ['wire-test0-1'] () {}
    }
    class Cls1 {
    }
    $.cc('wire-test0', Cls0)
    $.cc('wire-test0-1', Cls1)

    callDecorator($.cc.wire, Cls0, 'wire-test0-1')

    const elem = $('<div />').append($('<div />').cc('wire-test0-1'))

    const wireTest0 = elem.cc.init('wire-test0')

    assert(wireTest0['wire-test0-1'] instanceof Cls1)
  })

  it('can access to the class component at the same dom as decorated method\'s class', () => {
    class Cls0 {
      get ['wire-test2-1'] () {}
    }
    class Cls1 {
    }
    $.cc('wire-test2', Cls0)
    $.cc('wire-test2-1', Cls1)

    callDecorator($.cc.wire, Cls0, 'wire-test2-1')

    const wireTest0 = $('<div />').cc('wire-test2-1').cc.init('wire-test2')

    assert(wireTest0['wire-test2-1'] instanceof Cls1)
  })
})

describe('@wire(name, selector)', () => {
  it('replaces the getter of the decorated descriptor, and it returns the instance of class-component inside the element', () => {
    class Cls0 {
      get test () {}
    }
    class Cls1 {
    }
    $.cc('wire-test1', Cls0)
    $.cc('wire-test1-1', Cls1)

    callDecorator($.cc.wire('wire-test1-1', '.foo'), Cls0, 'test')

    const elem = $('<div />').append($('<div class="foo" />').cc('wire-test1-1'))

    const wireTest1 = elem.cc.init('wire-test1')

    assert(wireTest1.test instanceof Cls1)
  })
})