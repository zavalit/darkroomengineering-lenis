import { Emitter } from './emitter'
import type { VirtualScrollCallback } from './types'

const LINE_HEIGHT = 100 / 6
const listenerOptions: AddEventListenerOptions = { passive: false }

export class WheelVirtualScroll {
  window = { width: 0, height: 0 }
  private emitter = new Emitter()

  constructor(
    private element: HTMLElement,
    private options = { wheelMultiplier: 1 },
  ) {
    window.addEventListener('resize', this.onWindowResize, false)
    this.onWindowResize()

    this.element.addEventListener('wheel', this.onWheel, listenerOptions)
  }

  on(event: 'virtual-scroll', callback: VirtualScrollCallback) {
    return this.emitter.on(event, callback)
  }

  destroy() {
    this.emitter.destroy()
    window.removeEventListener('resize', this.onWindowResize, false)
    this.element.removeEventListener('wheel', this.onWheel, listenerOptions)
  }

  private onWheel = (event: WheelEvent) => {
    let { deltaX, deltaY, deltaMode } = event
    const multiplierX =
      deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.width : 1
    const multiplierY =
      deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.height : 1

    deltaX *= multiplierX
    deltaY *= multiplierY

    deltaX *= this.options.wheelMultiplier
    deltaY *= this.options.wheelMultiplier

    this.emitter.emit('virtual-scroll', { deltaX, deltaY, event })
  }

  private onWindowResize = () => {
    this.window = { width: window.innerWidth, height: window.innerHeight }
  }
}
