/// <reference types="react" />

declare module JSX {
  // allow intrinsic elements from React
  interface IntrinsicElements {
    [elemName: string]: any
  }
}
