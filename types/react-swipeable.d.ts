declare module "react-swipeable" {
  import type { RefObject } from "react"

  export type SwipeDirection = "Left" | "Right" | "Up" | "Down"

  export interface SwipeEventData {
    event: Event
    initial: [number, number]
    deltaX: number
    deltaY: number
    velocity: number
    dir: SwipeDirection
  }

  export interface SwipeableHandlersOptions {
    onSwiped?: (eventData: SwipeEventData, event?: Event) => void
    onSwiping?: (eventData: SwipeEventData, event?: Event) => void
    onSwipedLeft?: (eventData: SwipeEventData, event?: Event) => void
    onSwipedRight?: (eventData: SwipeEventData, event?: Event) => void
    onSwipedUp?: (eventData: SwipeEventData, event?: Event) => void
    onSwipedDown?: (eventData: SwipeEventData, event?: Event) => void
    trackMouse?: boolean
    preventScrollOnSwipe?: boolean
    delta?: number
    trackTouch?: boolean
    rotationAngle?: number
    swipeDuration?: number
    tolerance?: number
    touchEventOptions?: { passive?: boolean }
    innerRef?: RefObject<HTMLElement>
  }

  export type SwipeableHandlers = Record<string, any>

  export function useSwipeable(options: SwipeableHandlersOptions): SwipeableHandlers
}
