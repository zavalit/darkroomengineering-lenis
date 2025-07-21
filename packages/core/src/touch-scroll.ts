import { Emitter } from './emitter'
import type { VirtualScrollCallback } from './types'

const listenerOptions: AddEventListenerOptions = { passive: false }

export class TouchVirtualScroll {
  touchStart = { x: 0, y: 0 }
  lastDelta = { x: 0, y: 0 }
  private emitter = new Emitter()

  constructor(
    private element: HTMLElement,
    private options = { touchMultiplier: 1 },
  ) {
    this.element.addEventListener('touchstart', this.onTouchStart, listenerOptions)
    this.element.addEventListener('touchmove', this.onTouchMove, listenerOptions)
    this.element.addEventListener('touchend', this.onTouchEnd, listenerOptions)
  }

  on(event: 'virtual-scroll', callback: VirtualScrollCallback) {
    return this.emitter.on(event, callback)
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
    this.emitter.emit('virtual-scroll', { deltaX: 0, deltaY: 0, event })
  }

  private onTouchMove = (event: TouchEvent) => {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : (event as any)
    const deltaX = -(clientX - this.touchStart.x) * this.options.touchMultiplier
    const deltaY = -(clientY - this.touchStart.y) * this.options.touchMultiplier
    this.touchStart.x = clientX
    this.touchStart.y = clientY
    this.lastDelta = { x: deltaX, y: deltaY }
    this.emitter.emit('virtual-scroll', { deltaX, deltaY, event })
  }

  private onTouchEnd = (event: TouchEvent) => {
    this.emitter.emit('virtual-scroll', { deltaX: this.lastDelta.x, deltaY: this.lastDelta.y, event })
  }
}
