import { Emitter } from './emitter'
import type { VirtualScrollCallback, VirtualScrollData } from './types'

const LINE_HEIGHT = 100 / 6
const listenerOptions: AddEventListenerOptions = { passive: false }

class WheelVirtualScroll {
  window = { width: 0, height: 0 }
  private emitter = new Emitter()

  constructor(private element: HTMLElement, private multiplier = 1) {
    window.addEventListener('resize', this.onWindowResize, false)
    this.onWindowResize()
    this.element.addEventListener('wheel', this.onWheel, listenerOptions)
  }

  on(event: 'scroll', cb: VirtualScrollCallback) {
    return this.emitter.on(event, cb)
  }

  destroy() {
    this.emitter.destroy()
    window.removeEventListener('resize', this.onWindowResize, false)
    this.element.removeEventListener('wheel', this.onWheel, listenerOptions)
  }

  private onWheel = (event: WheelEvent) => {
    let { deltaX, deltaY, deltaMode } = event
    const multiplierX = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.width : 1
    const multiplierY = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.height : 1
    deltaX *= multiplierX
    deltaY *= multiplierY
    deltaX *= this.multiplier
    deltaY *= this.multiplier
    this.emitter.emit('scroll', { deltaX, deltaY, event })
  }

  private onWindowResize = () => {
    this.window = { width: window.innerWidth, height: window.innerHeight }
  }
}

class TouchVirtualScroll {
  touchStart = { x: 0, y: 0 }
  lastDelta = { x: 0, y: 0 }
  private emitter = new Emitter()

  constructor(private element: HTMLElement, private multiplier = 1) {
    this.element.addEventListener('touchstart', this.onTouchStart, listenerOptions)
    this.element.addEventListener('touchmove', this.onTouchMove, listenerOptions)
    this.element.addEventListener('touchend', this.onTouchEnd, listenerOptions)
  }

  on(event: 'scroll', cb: VirtualScrollCallback) {
    return this.emitter.on(event, cb)
  }

  destroy() {
    this.emitter.destroy()
    this.element.removeEventListener('touchstart', this.onTouchStart, listenerOptions)
    this.element.removeEventListener('touchmove', this.onTouchMove, listenerOptions)
    this.element.removeEventListener('touchend', this.onTouchEnd, listenerOptions)
  }

  private onTouchStart = (event: TouchEvent) => {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : (event as any)
    this.touchStart.x = clientX
    this.touchStart.y = clientY
    this.lastDelta = { x: 0, y: 0 }
    this.emitter.emit('scroll', { deltaX: 0, deltaY: 0, event })
  }

  private onTouchMove = (event: TouchEvent) => {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : (event as any)
    const deltaX = -(clientX - this.touchStart.x) * this.multiplier
    const deltaY = -(clientY - this.touchStart.y) * this.multiplier
    this.touchStart.x = clientX
    this.touchStart.y = clientY
    this.lastDelta = { x: deltaX, y: deltaY }
    this.emitter.emit('scroll', { deltaX, deltaY, event })
  }

  private onTouchEnd = (event: TouchEvent) => {
    this.emitter.emit('scroll', { deltaX: this.lastDelta.x, deltaY: this.lastDelta.y, event })
  }
}

export class VirtualScroll {
  private emitter = new Emitter()
  private wheel: WheelVirtualScroll
  private touch: TouchVirtualScroll

  constructor(element: HTMLElement, options = { wheelMultiplier: 1, touchMultiplier: 1 }) {
    this.wheel = new WheelVirtualScroll(element, options.wheelMultiplier)
    this.touch = new TouchVirtualScroll(element, options.touchMultiplier)
    this.wheel.on('scroll', this.reemit)
    this.touch.on('scroll', this.reemit)
  }

  on(event: 'scroll', cb: VirtualScrollCallback) {
    return this.emitter.on(event, cb)
  }

  destroy() {
    this.emitter.destroy()
    this.wheel.destroy()
    this.touch.destroy()
  }

  private reemit = (data: VirtualScrollData) => {
    this.emitter.emit('scroll', data)
  }
}
